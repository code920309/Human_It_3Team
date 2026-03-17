import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Heart, ChevronLeft, Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '안녕하세요! CareLink AI 건강 비서입니다. 당신의 건강검진 결과에 대해 궁금한 점이 있으신가요?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('carelink_token');
      const res = await axios.get('/api/chatbot/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.data.length > 0) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsgText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsgText }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('carelink_token');
      const res = await axios.post('/api/chatbot/message', 
        { message: userMsgText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.data.aiResponse }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '죄송합니다. 서버와 통신 중 오류가 발생했습니다.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f7f0]">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f7f0] flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-orange-100 sticky top-0 z-30 shrink-0">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between w-full">
          <Link to="/mypage" className="flex items-center gap-2 text-slate-600 font-bold hover:text-teal-600 transition-all">
            <ChevronLeft className="w-6 h-6" /> 뒤로가기
          </Link>
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-teal-600" />
            <h1 className="text-xl font-black text-slate-900">AI 건강 챗봇</h1>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-teal-600 text-white' : 'bg-white border border-orange-100 text-teal-600'}`}>
                {msg.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
              </div>
              <div className={`max-w-[80%] p-5 rounded-3xl shadow-sm ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-white border border-orange-100 text-slate-700 rounded-tl-none'}`}>
                <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : ''}`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white border border-orange-100 text-teal-600 flex items-center justify-center shadow-sm">
                <Bot className="w-6 h-6" />
              </div>
              <div className="p-4 bg-white border border-orange-100 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                <span className="text-slate-400 text-sm font-medium">AI가 분석 중입니다...</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <div className="bg-white border-t border-orange-100 p-4 pb-8 shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['제 콜레스테롤 수치가 많이 위험한가요?', '공복 혈당 낮추는 법 알려줘', '간 수치 개선 식단 추천해줘'].map((q, i) => (
              <button 
                key={i}
                onClick={() => setInput(q)}
                className="whitespace-nowrap px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-500 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-600 transition-all shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="건강에 대해 궁금한 점을 물어보세요..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 pl-6 pr-16 focus:ring-2 focus:ring-teal-500 outline-none transition-all font-medium text-slate-700 shadow-inner"
            />
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-teal-600 text-white rounded-xl flex items-center justify-center hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 transition-all shadow-lg active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <AlertCircle className="w-3 h-3 text-teal-400" />
            본 답변은 참고용이며 정확한 진단은 전문의와 상담하십시오
          </div>
        </div>
      </div>
    </div>
  );
}
