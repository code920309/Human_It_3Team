import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  MessageCircle, X, Send, Bot, Loader2, Minimize2, 
  Trash2, RefreshCcw, ClipboardList, ImageIcon, 
  AlertCircle, Upload, Sparkles, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { GoogleGenerativeAI } from "@google/generative-ai";
import api from '../api/axios';

// Initialize Gemini for fallback (following ChatbotPage.jsx)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenerativeAI(GEMINI_API_KEY);

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: '안녕하세요! CareLink 건강 비서입니다. 건강검진 결과를 업로드하시거나 궁금한 건강 정보를 물어보세요. 맞춤 상담을 제공해드립니다.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isCheckingDB, setIsCheckingDB] = useState(false);
  const [showNoResultMsg, setShowNoResultMsg] = useState(false);
  const [invalidFileError, setInvalidFileError] = useState(false);
  
  const location = useLocation();
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Recommended questions
  const recommendedQuestions = [
    "공복 혈당이 높을 때 좋은 식단은?",
    "혈압을 낮추는 데 효과적인 운동은?",
    "콜레스테롤 수치를 관리하는 생활 습관",
    "내 간 수치가 정상인가요?",
    "종합 건강 점수 올리는 방법"
  ];

  // ALWAYS define hooks at top
  useEffect(() => {
    if (isOpen && messages.length === 1 && location.pathname !== '/login') {
      const token = localStorage.getItem('carelink_token');
      if (token) {
        fetchHistory();
      }
    }
  }, [isOpen, location.pathname]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isLoading, isOpen]);

  // Early return for login page
  if (location.pathname === '/login') return null;

  const fetchHistory = async () => {
    setIsInitialLoading(true);
    try {
      const response = await api.get('/chatbot/history');
      if (response.data.success && response.data.data.length > 0) {
        const transformedHistory = response.data.data.map((msg, index) => ({
          id: `hist-${index}`,
          role: msg.role === 'model' ? 'assistant' : msg.role,
          content: msg.message || msg.content,
          timestamp: new Date(msg.created_at || Date.now()),
        }));
        setMessages(transformedHistory);
      }
    } catch (error) {
      console.error("History fetch error:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleSend = async (textOverride) => {
    const messageText = textOverride || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textOverride) setInput('');
    setIsLoading(true);

    const token = localStorage.getItem('carelink_token');
    
    // If logged in, try Backend first
    if (token) {
      try {
        console.log("ChatWidget: Attempting backend call...");
        const response = await api.post('/chatbot/message', { message: messageText });
        if (response.data.success) {
          const assistantMessage = {
            id: `${Date.now()}-ai`,
            role: 'assistant',
            content: response.data.data.aiResponse,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
          setShowRecommendations(false);
          return;
        }
      } catch (error) {
        console.error("ChatWidget: Backend Error:", error.message);
      }
    }

    // Fallback to Frontend Gemini
    try {
      console.log("ChatWidget: Attempting Frontend Gemini fallback...");
      console.log("API Key loaded (first 5):", GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 5) : "MISSING");
      
      if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing");

      const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
      const chat = model.startChat({
        history: messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }))
          .filter((m, i, arr) => {
            const firstUserIndex = arr.findIndex(msg => msg.role === 'user');
            if (firstUserIndex === -1) return false;
            return i >= firstUserIndex;
          })
          .slice(-6),
      });
      const result = await chat.sendMessage(messageText);
      const text = result.response.text();
      
      const assistantMessage = {
        id: `${Date.now()}-ai-fallback`,
        role: 'assistant',
        content: text + (token ? "\n\n*(주의: 서버 연결 문제로 오프라인 모드로 응답했습니다.)*" : "\n\n*(안내: 로그인 하시면 내 검진 데이터를 기반으로 맞춤 상담을 받으실 수 있습니다.)*"),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (fallbackError) {
      console.error("ChatWidget: Fallback Error:", fallbackError.message);
      setMessages(prev => [...prev, {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: "현재 AI 비서가 응답할 수 없는 상태입니다. 잠시 후 다시 시도해주세요.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
      setShowRecommendations(false);
    }
  };

  const handleFileUploadClick = async () => {
    const token = localStorage.getItem('carelink_token');
    if (!token) {
      setMessages(prev => [...prev, {
        id: 'no-login',
        role: 'assistant',
        content: '내 검진 데이터를 분석하려면 먼저 **로그인**이 필요합니다.',
        timestamp: new Date()
      }]);
      return;
    }

    setIsCheckingDB(true);
    setShowNoResultMsg(false);
    try {
      const response = await api.get('/report/health');
      if (response.data.success && response.data.data) {
        const healthData = response.data.data;
        handleSend(`내 가장 최근 건강검진 결과(${healthData.exam_year}년)에 대해 분석해줘.`);
      } else {
        setShowNoResultMsg(true);
      }
    } catch (error) {
      console.error("DB Check Error:", error);
      setShowNoResultMsg(true);
    } finally {
      setIsCheckingDB(false);
    }
  };

  const handleClearDB = async () => {
    if (!window.confirm("모든 대화 기록을 삭제하시겠습니까?")) return;
    setMessages([{
      id: 'reset',
      role: 'assistant',
      content: '대화 기록이 초기화되었습니다. 새로 궁금하신 점을 물어보세요.',
      timestamp: new Date()
    }]);
  };

  const handleFileChange = async (e) => {
    const token = localStorage.getItem('carelink_token');
    if (!token) {
      alert('파일 업로드는 로그인 후 가능합니다.');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
       setInvalidFileError(true);
       return;
    }

    setInvalidFileError(false);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('reportFile', file);

    try {
      setMessages(prev => [...prev, {
        id: `upload-${Date.now()}`,
        role: 'user',
        content: `검진 결과 파일(${file.name})을 업로드했습니다. 분석해줘!`,
        timestamp: new Date()
      }]);

      const response = await api.post('/report/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setMessages(prev => [...prev, {
          id: `ai-upload-${Date.now()}`,
          role: 'assistant',
          content: "파일 분석을 완료했습니다! 건강 리포트가 생성되었습니다. \n\n" + (response.data.data.aiReport?.summary || "리포트 상세 내용을 확인해보세요."),
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: "파일을 업로드하는 중에 문제가 발생했습니다.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-24 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
      {/* Floating Toggle Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto p-4 rounded-[1.5rem] shadow-2xl transition-all flex items-center gap-3 active:scale-95 ${
          isOpen 
            ? 'bg-slate-900 text-white' 
            : 'bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-teal-600/30'
        }`}
      >
        {isOpen ? <Minimize2 size={24} /> : <MessageCircle size={24} />}
        {!isOpen && <span className="font-bold text-sm pr-1">CareLink AI</span>}
      </motion.button>

      {/* Floating Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'top right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="pointer-events-auto w-[350px] sm:w-[420px] h-[520px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col overflow-hidden glass-effect"
          >
            {/* Header */}
            <header className="bg-gradient-to-r from-teal-600 to-teal-700 p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight text-white leading-none mb-1">CareLink AI 비서</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold opacity-80 text-white/90">AI HEALTH SPECIALIST</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleClearDB}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white"
                  title="기록 삭제"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </header>

            {/* Content Area */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth relative"
            >
              {isInitialLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin opacity-40" />
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role !== 'user' && (
                      <div className="w-7 h-7 bg-white border border-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 text-teal-600 shadow-sm mt-1">
                        <Bot size={16} />
                      </div>
                    )}
                    <div className={`max-w-[80%] p-4 rounded-[1.5rem] shadow-sm relative ${
                      msg.role === 'user' 
                        ? 'bg-teal-600 text-white rounded-tr-none' 
                        : msg.isError
                          ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none'
                          : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                    }`}>
                      <div className={`prose prose-sm max-w-none leading-relaxed text-[13px] ${msg.role === 'user' ? 'prose-invert' : ''}`}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      <p className={`text-[9px] mt-2 font-black tracking-tighter opacity-30 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex justify-start gap-2">
                  <div className="w-7 h-7 bg-white border border-slate-100 rounded-lg flex items-center justify-center shrink-0">
                    <Loader2 size={16} className="text-teal-600 animate-spin" />
                  </div>
                  <div className="bg-white border border-slate-100 p-4 rounded-[1.5rem] rounded-tl-none shadow-sm space-y-1">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Overlay Menus */}
            <AnimatePresence>
               {(invalidFileError || showNoResultMsg || showRecommendations) && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 10 }}
                   className="px-4 pb-2 bg-slate-50/50"
                 >
                   {invalidFileError && (
                     <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-2 text-[11px] text-red-700 font-bold mb-2">
                       <AlertCircle size={14} /> 지원되지 않는 파일 형식입니다.
                       <button onClick={() => setInvalidFileError(false)} className="ml-auto"><X size={14}/></button>
                     </div>
                   )}
                   {showNoResultMsg && (
                     <div className="p-3 bg-orange-50 border border-orange-200 rounded-2xl space-y-2 mb-2">
                        <div className="flex items-center gap-2 text-[11px] text-orange-800 font-bold">
                          <AlertCircle size={14} /> 건강 데이터가 없습니다. 파일을 먼저 업로드해주세요.
                        </div>
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-2 bg-orange-600 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1"
                        >
                          <Upload size={14} /> 지금 업로드
                        </button>
                     </div>
                   )}
                   {showRecommendations && (
                     <div className="flex flex-wrap gap-2 mb-1">
                       {recommendedQuestions.map((q, i) => (
                         <button
                           key={i}
                           onClick={() => handleSend(q)}
                           className="px-3 py-1.5 bg-white border border-teal-100 text-teal-600 text-[11px] font-bold rounded-full hover:bg-teal-600 hover:text-white transition-all shadow-sm"
                         >
                           {q}
                         </button>
                       ))}
                     </div>
                   )}
                 </motion.div>
               )}
            </AnimatePresence>

            {/* Toolbar */}
            <div className="px-4 py-2 flex items-center justify-between border-t border-slate-100 bg-white shrink-0">
               <div className="flex gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                    title="이미지/PDF 업로드"
                  >
                    <ImageIcon size={18} />
                  </button>
                  <button 
                    onClick={handleFileUploadClick}
                    disabled={isCheckingDB}
                    className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                    title="내 결과 분석"
                  >
                    {isCheckingDB ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
                  </button>
               </div>
               <button 
                onClick={() => setShowRecommendations(!showRecommendations)}
                className={`p-2 rounded-xl transition-all ${showRecommendations ? 'bg-teal-100 text-teal-600' : 'text-slate-400 hover:bg-slate-100'}`}
               >
                 <ClipboardList size={18} />
               </button>
            </div>

            {/* Main Input */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              <div className="relative flex items-center gap-2 bg-slate-100/80 rounded-[1.5rem] p-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 transition-all border border-transparent focus-within:border-teal-100">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,application/pdf"
                />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 bg-transparent py-3 pl-4 text-[13px] font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20 hover:bg-teal-700 disabled:opacity-30 transition-all active:scale-90 flex-shrink-0"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="mt-2 text-[9px] text-slate-400 text-center font-bold tracking-tighter uppercase">
                <span className="text-teal-500">CareLink Pro</span> • Precision AI Service
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .glass-effect {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .prose p {
          margin: 0 !important;
        }
        .prose strong {
          color: inherit;
        }
      `}</style>
    </div>
  );
};

export default ChatWidget;
