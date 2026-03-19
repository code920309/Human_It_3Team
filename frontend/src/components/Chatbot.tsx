import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2, Plus, Minus, HeartPulse, Activity, ClipboardList, AlertCircle, Upload, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '안녕하세요! CareLink 건강 비서입니다. 건강검진 결과를 업로드하시거나 궁금한 건강 정보를 물어보세요.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNoResultMsg, setShowNoResultMsg] = useState(false);
  const [isCheckingDB, setIsCheckingDB] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [invalidFileError, setInvalidFileError] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const messageText = textOverride || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textOverride) setInput('');
    setIsLoading(true);

    try {
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: `당신은 'CareLink'의 전문 건강 상담 AI 비서입니다. 
          사용자의 건강검진 결과를 분석하고 맞춤형 건강 가이드(식단, 운동, 생활 습관)를 제공하는 것이 주 목적입니다.
          
          주요 원칙:
          1. 전문적이고 신뢰감 있는 어조를 유지하되, 사용자가 이해하기 쉽게 설명하세요.
          2. 의학적 진단이 아닌 '참고용 정보'임을 명시하세요 (문구: "본 상담은 참고용이며, 정확한 진단은 전문의와 상의하십시오").
          3. 사용자의 수치(혈당, 혈압 등)가 언급되면 정상 범위와 비교하여 구체적인 가이드를 제시하세요.
          4. '오늘의 액션 플랜'을 제안하여 실천을 유도하세요.`,
        },
      });

      const response = await chat.sendMessage({ message: messageText });
      
      const assistantMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: response.text || "죄송합니다. 응답을 생성하는 중에 문제가 발생했습니다.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Gemini Error:", error);
      const errorMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: "연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUploadClick = async () => {
    setIsCheckingDB(true);
    setShowNoResultMsg(false);

    try {
      const response = await fetch('/api/health-data/latest');
      if (response.ok) {
        const result = await response.json();
        analyzeHealthData(JSON.stringify(result.data), "DB에 저장된 검진 결과");
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
    setIsLoading(true);
    setShowNoResultMsg(false);
    
    try {
      const response = await fetch('/api/health-data', {
        method: 'DELETE'
      });
      if (response.ok) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: '저장된 건강 검진 결과가 성공적으로 삭제되었습니다.',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error("Clear DB Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '데이터 삭제 중 오류가 발생했습니다.',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeHealthData = async (data: string | { inlineData: { data: string, mimeType: string } }, source: string) => {
    const userMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: typeof data === 'string' ? `${source}를 분석해줘.` : `${source} 이미지를 분석해줘.`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const parts = [];
      if (typeof data === 'string') {
        parts.push({ text: `다음 건강 데이터를 세밀하게 분석하고 가이드를 제공해줘. 특히 수치들을 정확하게 추출해서 설명해줘: ${data}` });
      } else {
        parts.push(data);
        parts.push({ text: "이 이미지에 포함된 건강검진 결과 수치(혈압, 혈당, 간수치, 콜레스테롤 등)를 정확하게 읽고 분석해줘. 이미지에 적힌 값 그대로를 바탕으로 가이드를 작성해줘." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts },
        config: {
          systemInstruction: `당신은 'CareLink'의 전문 건강 상담 AI 비서입니다. 
          사용자가 제공한 이미지나 텍스트 데이터를 바탕으로 '실제 수치'를 정확하게 추출하는 것이 가장 중요합니다.
          
          분석 가이드:
          1. 이미지에 적힌 수치를 하나하나 정확히 읽으세요. (환각 현상 주의)
          2. 추출된 수치를 정상 범위와 비교하여 설명하세요.
          3. 의학적 진단이 아님을 명시하되, 수치 기반의 구체적인 생활 가이드를 제공하세요.
          4. 수치가 불분명하거나 읽기 어려운 경우 추측하지 말고 다시 업로드해달라고 요청하세요.`,
        },
      });

      // Save to mock DB if it was a successful analysis of new data
      if (typeof data !== 'string' || source !== "DB에 저장된 검진 결과") {
        try {
          await fetch('/api/health-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source,
              timestamp: new Date().toISOString(),
              analysis: response.text,
              data: typeof data === 'string' ? data : "Image Data"
            })
          });
        } catch (dbError) {
          console.error("Failed to save to mock DB:", dbError);
        }
      }
      
      const assistantMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: response.text || "분석 중 오류가 발생했습니다.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Gemini Error:", error);
      const errorMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: "이미지 분석 중 오류가 발생했습니다. 파일 형식을 확인하거나 잠시 후 다시 시도해주세요.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setInvalidFileError(false);
    setIsLoading(true);
    setShowNoResultMsg(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result?.toString().split(',')[1];
      if (!base64Data) {
        setIsLoading(false);
        return;
      }

      // For images, we send directly to Gemini
      if (file.type.startsWith('image/')) {
        analyzeHealthData({
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        }, file.name);
      } else {
        // For other files, we simulate text extraction for now or use generic message
        const simulatedContent = `파일명: ${file.name} (텍스트 추출 시뮬레이션)`;
        analyzeHealthData(simulatedContent, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const recommendedQuestions = [
    "공복 혈당이 높을 때 좋은 식단은?",
    "혈압을 낮추는 데 효과적인 운동은?",
    "콜레스테롤 수치를 관리하는 생활 습관",
    "건강검진 결과지에서 주의 깊게 봐야 할 항목",
    "나이대별 권장 건강검진 주기"
  ];

  const handleRecommendationClick = (question: string) => {
    handleSend(question);
    setShowRecommendations(false);
  };

  return (
    <>
      <button
        id="chatbot-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all duration-300 flex items-center justify-center group"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && (
          <span className="absolute right-full mr-3 px-3 py-1 bg-white text-emerald-600 text-sm font-medium rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-emerald-100">
            CareLink AI 상담 시작
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed right-6 bottom-6 bg-white rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden border border-slate-200 transition-all duration-300 ${
              isExpanded ? 'top-6 left-6 max-w-none' : 'top-10 w-full max-w-[400px]'
            }`}
          >
            <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <HeartPulse size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">CareLink AI</h3>
                  <p className="text-xs text-emerald-100">맞춤형 건강 비서</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 opacity-70 text-[10px] uppercase tracking-wider font-bold">
                      {msg.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                      {msg.role === 'user' ? '나' : 'CareLink AI'}
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                    <div className="mt-1 text-[9px] opacity-50 text-right">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 rounded-tl-none">
                    <Loader2 size={16} className="animate-spin text-emerald-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-100 relative">
              {/* Expand/Collapse Button at Bottom Left */}
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute -top-12 left-4 p-2 bg-emerald-600 text-white rounded-full shadow-md hover:bg-emerald-700 transition-all z-50"
                title={isExpanded ? "축소" : "확대"}
              >
                {isExpanded ? <Minus size={18} /> : <Plus size={18} />}
              </button>

              {invalidFileError && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="text-xs font-bold text-red-700">건강검진 결과서만 업로드 부탁드립니다.</p>
                    <p className="text-[10px] text-red-600 mt-1">분석 가능한 형식의 건강검진 결과 파일이나 이미지를 선택해주세요.</p>
                  </div>
                  <button onClick={() => setInvalidFileError(false)} className="text-red-400 hover:text-red-600">
                    <X size={14} />
                  </button>
                </motion.div>
              )}

              {showNoResultMsg && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-xl shadow-sm relative"
                >
                  <button 
                    onClick={() => setShowNoResultMsg(false)}
                    className="absolute top-3 right-3 text-orange-400 hover:text-orange-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                  <div className="flex items-center gap-2 text-orange-700 font-bold text-sm mb-2">
                    <AlertCircle size={16} />
                    <span>검진 결과가 없어요!</span>
                  </div>
                  <p className="text-xs text-orange-600 mb-3">
                    검사된 결과가 없습니다. 직접 파일이나 이미지를 업로드하여 분석을 시작해보세요.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors"
                  >
                    <Upload size={14} /> 파일/이미지 업로드
                  </button>
                </motion.div>
              )}

              {showRecommendations && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 flex flex-wrap gap-2"
                >
                  {recommendedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleRecommendationClick(q)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,.pdf,.txt"
              />

              <div className="flex flex-col gap-2 mb-3">
                <button
                  onClick={handleFileUploadClick}
                  disabled={isCheckingDB}
                  className="w-full py-2 px-3 border-2 border-dashed border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCheckingDB ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  건강검진 결과 업로드
                </button>
                <button
                  onClick={() => setShowRecommendations(!showRecommendations)}
                  className={`w-full py-2 px-3 border border-emerald-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                    showRecommendations ? 'bg-emerald-600 text-white' : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  <ClipboardList size={14} /> 건강 관련 질문 추천
                </button>
                <button
                  onClick={handleClearDB}
                  className="w-full py-2 px-3 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> 기존 데이터 삭제
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 p-3 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="mt-2 text-[10px] text-slate-400 text-center">
                본 상담은 참고용이며, 정확한 진단은 전문의와 상의하십시오.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
