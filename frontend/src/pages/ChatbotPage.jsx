import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, X, Send, User, Bot, Loader2, Plus, Minus, 
  HeartPulse, Activity, ClipboardList, AlertCircle, Upload, 
  Trash2, ChevronLeft, Sparkles, Image as ImageIcon,
  History, Settings, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import api from '../api/axios';

// Initialize Gemini - Using VITE_ prefix for Vite environment
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: '안녕하세요! CareLink 건강 비서입니다. 건강검진 결과를 업로드하시거나 궁금한 건강 정보를 물어보세요. 저는 당신의 최신 검진 데이터를 기반으로 맞춤 상담을 제공합니다.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showNoResultMsg, setShowNoResultMsg] = useState(false);
  const [isCheckingDB, setIsCheckingDB] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [invalidFileError, setInvalidFileError] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Fetch History on Mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/chatbot/history');
        if (response.data.success && response.data.data.length > 0) {
          const transformedHistory = response.data.data.map((msg, index) => ({
            id: `hist-${index}`,
            role: msg.role === 'model' ? 'assistant' : msg.role,
            content: msg.content,
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
    fetchHistory();
  }, []);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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

    try {
      // Use Backend API for persistent chat and context awareness
      const response = await api.post('/chatbot/message', { message: messageText });
      
      if (response.data.success) {
        const assistantMessage = {
          id: `${Date.now()}-ai`,
          role: 'assistant',
          content: response.data.data.aiResponse,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(response.data.message || "Failed to get response");
      }
    } catch (error) {
      console.error("Chat Error:", error);
      
      // Fallback to Frontend Gemini if Backend fails
      try {
        const chat = ai.chats.create({
          model: "gemini-1.5-flash",
          config: {
            systemInstruction: "당신은 CareLink의 전문 건강 상담 AI 비서입니다. 사용자의 건강 상담을 돕고, 따뜻하게 격려하세요.",
          },
        });
        const response = await chat.sendMessage({ message: messageText });
        const text = response.text || "죄송합니다. 응답을 생성하는 중에 문제가 발생했습니다.";
        
        setMessages(prev => [...prev, {
          id: `${Date.now()}-ai-fallback`,
          role: 'assistant',
          content: text + "\n\n*(주의: 서버 연결 문제로 오프라인 모드로 응답했습니다.)*",
          timestamp: new Date(),
        }]);
      } catch (fallbackError) {
        setMessages(prev => [...prev, {
          id: `${Date.now()}-error`,
          role: 'assistant',
          content: "연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
          timestamp: new Date(),
          isError: true
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUploadClick = async () => {
    setIsCheckingDB(true);
    setShowNoResultMsg(false);

    try {
      // Check for latest health data in the actual DB
      const response = await api.get('/report/health');
      if (response.data.success && response.data.data) {
        const healthData = response.data.data;
        // Construct analysis request based on latest data
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
    
    setIsLoading(true);
    try {
      setMessages([{
        id: 'reset',
        role: 'assistant',
        content: '대화 기록이 초기화되었습니다. 새로 궁금하신 점을 물어보세요.',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error("Clear Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
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

      // Use existing report upload endpoint
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
        content: "파일을 업로드하는 중에 문제가 발생했습니다. 일반적인 이미지나 공식 결과지 형식인지 확인해주세요.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const recommendedQuestions = [
    "공복 혈당이 높을 때 좋은 식단은?",
    "혈압을 낮추는 데 효과적인 운동은?",
    "콜레스테롤 수치를 관리하는 생활 습관",
    "내 간 수치가 정상인가요?",
    "종합 건강 점수 올리는 방법"
  ];

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">CareLink AI를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col overflow-hidden font-sans">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-4 py-3 shrink-0 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link 
            to="/mypage" 
            className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-all font-semibold group"
          >
            <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-teal-50 transition-colors">
              <ChevronLeft size={20} />
            </div>
            <span className="hidden sm:inline">뒤로가기</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-600/20">
                <Bot size={22} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
                CareLink AI 비서
                <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-[10px] font-bold rounded-full uppercase">Pro</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Activity size={10} className="text-emerald-500" />
                실시간 맞춤 건강 가이드
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleClearDB}
              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="검색 기록 삭제"
            >
              <Trash2 size={20} />
            </button>
            <button className="p-2.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-grid-slate-100/50 p-4 md:p-6"
      >
        <div className="max-w-4xl mx-auto space-y-8 pb-32">
          {/* Welcome Message Extra Info */}
          <div className="text-center py-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 text-[13px] text-slate-500 font-medium italic">
              <Sparkles size={14} className="text-amber-400" />
              "내 혈당 수치에 맞는 식단을 알려줘" 라고 물어보세요.
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                key={msg.id}
                className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'justify-start'}`}
              >
                <div className={`w-9 h-9 md:w-11 md:h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform hover:scale-105 ${
                  msg.role === 'user' 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-white border border-slate-100 text-teal-600 shadow-md shadow-teal-600/5'
                }`}
                >
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={22} />}
                </div>

                <div className={`max-w-[85%] md:max-w-[70%] space-y-1`}>
                   <div className={`flex items-center gap-2 mb-1 px-1 text-[11px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'flex-row-reverse text-slate-400' : 'text-teal-600'}`}>
                    <span>{msg.role === 'user' ? 'ME' : 'CareLink AI'}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="font-medium normal-case text-slate-400">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className={`p-4 md:p-6 rounded-[2rem] shadow-sm relative group transition-all ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-tr-none' 
                      : msg.isError 
                        ? 'bg-red-50 border border-red-100 text-red-700 rounded-tl-none'
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-md shadow-slate-200/50'
                  }`}>
                    <div className={`prose prose-slate prose-sm max-w-none leading-relaxed overflow-hidden ${msg.role === 'user' ? 'prose-invert' : ''}`}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 text-teal-600 flex items-center justify-center shadow-sm">
                  <Bot size={22} />
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-[2rem] rounded-tl-none shadow-md shadow-slate-200/50 flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-teal-600 rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-slate-400 text-sm font-semibold tracking-tight">AI 비서가 분석 중...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Input Area Wrapper */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent pt-10 pb-6 z-40">
        <div className="max-w-4xl mx-auto px-4">
          
          <AnimatePresence>
            {invalidFileError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-4 p-4 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-3 shadow-xl shadow-red-500/10"
              >
                <AlertCircle className="text-red-500 shrink-0" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-800">지원되지 않는 형식입니다.</p>
                  <p className="text-xs text-red-600 mt-1">이미지 파일이나 PDF 형식의 검진 결과지를 업로드해주세요.</p>
                </div>
                <button onClick={() => setInvalidFileError(false)} className="p-1.5 hover:bg-red-100 rounded-full text-red-400">
                  <X size={18} />
                </button>
              </motion.div>
            )}

            {showNoResultMsg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-4 p-5 bg-orange-50 border border-orange-200 rounded-[2rem] shadow-xl shadow-orange-500/10 relative"
              >
                <button 
                  onClick={() => setShowNoResultMsg(false)}
                  className="absolute top-4 right-4 text-orange-400 hover:text-orange-600 transition-colors"
                >
                  <X size={18} />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-200 rounded-xl text-orange-700">
                    <AlertCircle size={20} />
                  </div>
                  <span className="text-orange-900 font-black">검진 결과 데이터가 없습니다</span>
                </div>
                <p className="text-[13px] text-orange-700/80 mb-4 leading-relaxed">
                  CareLink에 등록된 건강 데이터가 아직 없습니다. <br className="hidden sm:inline" /> 
                  검진 결과 이미지를 직접 업로드하여 분석을 시작해보세요!
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 bg-orange-600 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-orange-700 transition-all shadow-lg active:scale-95"
                >
                  <Upload size={18} /> 지금 파일 업로드하기
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mb-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-[13px] font-bold text-slate-600 flex items-center gap-2 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-600 transition-all shadow-sm"
                >
                  <ImageIcon size={16} /> 분석 요청
                </button>
                <button 
                  onClick={handleFileUploadClick}
                  disabled={isCheckingDB}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-[13px] font-bold text-slate-600 flex items-center gap-2 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-600 transition-all shadow-sm disabled:opacity-50"
                >
                   {isCheckingDB ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />} 
                   기존 데이터 불러오기
                </button>
              </div>
              <button 
                onClick={() => setShowRecommendations(!showRecommendations)}
                className={`p-2 rounded-xl transition-all ${showRecommendations ? 'bg-teal-100 text-teal-600' : 'bg-white text-slate-400 hover:bg-slate-100'}`}
              >
                <ClipboardList size={20} />
              </button>
            </div>

            {showRecommendations && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth"
              >
                {recommendedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="whitespace-nowrap px-4 py-2 bg-white border border-slate-200 text-slate-500 text-[12px] font-bold rounded-2xl hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all shadow-sm active:scale-95"
                  >
                    {q}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-teal-600 blur-2xl opacity-0 group-focus-within:opacity-10 transition-opacity"></div>
            <div className="relative flex items-center gap-2">
              <div className="flex-1 relative flex items-center">
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
                  placeholder="무엇이든 물어보세요 (예: 고혈압 식단 알려줘)"
                  className="w-full pl-6 pr-14 py-4 md:py-5 bg-white border border-slate-200 rounded-[2rem] text-[15px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xl shadow-slate-200/50"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 w-11 h-11 md:w-13 md:h-13 bg-teal-600 text-white rounded-2xl flex items-center justify-center hover:bg-teal-700 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-600/20 active:scale-95 z-10"
                >
                  <Send size={22} className={isLoading ? "animate-pulse" : ""} />
                </button>
              </div>
            </div>
          </div>

          <p className="mt-4 text-[10px] text-slate-400 text-center font-bold uppercase tracking-[0.2em]">
            <span className="text-teal-400">Precise Insight</span> • 본 상담은 참고용이며, 정확한 진단은 전문의와 상의하십시오.
          </p>
        </div>
      </div>
    </div>
  );
}
