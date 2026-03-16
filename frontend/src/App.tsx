/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Upload, 
  User as UserIcon, 
  LogOut, 
  MessageSquare, 
  LayoutDashboard, 
  History, 
  Presentation,
  ChevronRight,
  Plus,
  ArrowRight,
  Shield,
  Heart,
  Globe,
  Brain,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Loader2,
  FileText,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import Markdown from 'react-markdown';

import { User, HealthReport, ChatMessage, HealthMetric } from './types';
import { Language, translations } from './translations';
import { auth } from './firebase';

// --- Context ---
const LanguageContext = React.createContext<{
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof translations.ko;
}>({
  lang: 'ko',
  setLang: () => {},
  t: translations.ko
});
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { 
  getUserFromFirestore, 
  saveUserToFirestore, 
  getReportsFromFirestore, 
  saveReportToFirestore,
  testConnection
} from './storage';
import { analyzeHealthCheckup, getChatResponse } from './services/geminiService';

// --- Components ---

const getTranslatedMetricName = (name: string, t: any) => {
  return t.metricNames?.[name] || name;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const Navbar = ({ user, onLogout }: { user: User | null; onLogout: () => void }) => {
  const location = useLocation();
  const { lang, setLang, t } = React.useContext(LanguageContext);
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-200 group-hover:scale-105 transition-transform">
              <Activity size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">CareLink</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center bg-zinc-100 p-1 rounded-xl">
              <button 
                onClick={() => setLang('ko')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${lang === 'ko' ? 'bg-white text-brand-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                KO
              </button>
              <button 
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${lang === 'en' ? 'bg-white text-brand-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                EN
              </button>
            </div>

            <button 
              onClick={() => (window as any).aistudio?.openSelectKey()}
              className="text-xs text-slate-400 hover:text-brand-600 flex items-center gap-1 transition-colors"
            >
              <Shield size={14} />
              {t.nav.apiKey}
            </button>
            {user ? (
              <>
                <Link to="/" className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900'}`}>{t.nav.home}</Link>
                <Link to="/upload" className={`text-sm font-medium transition-colors ${isActive('/upload') ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900'}`}>{t.nav.upload}</Link>
                <Link to="/mypage" className={`text-sm font-medium transition-colors ${isActive('/mypage') ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900'}`}>{t.nav.mypage}</Link>
                <button onClick={onLogout} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors">
                  <LogOut size={18} />
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-6 py-2 bg-brand-600 text-white rounded-full text-sm font-bold hover:bg-brand-700 transition-colors shadow-md shadow-brand-100">{t.nav.login}</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const Chatbot = ({ user, reports }: { user: User | null; reports: HealthReport[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = React.useContext(LanguageContext);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const latestReport = reports[0];
      // Provide a guest user if null
      const activeUser = user || { id: 'guest', name: 'GUEST', email: '', gender: 'other', age: 0 } as User;
      const { lang } = React.useContext(LanguageContext);
      const response = await getChatResponse([...messages, userMsg], activeUser, lang, latestReport);
      setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message || "";
      if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('limit')) {
        setMessages(prev => [...prev, { role: 'model', content: t.chatbot.errorQuota }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: t.chatbot.errorGeneric }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-80 sm:w-96 h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            <div className="p-4 bg-brand-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Brain size={20} />
                <span className="font-semibold">CareLink AI</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.length === 0 && (
                <div className="text-center py-10 space-y-2">
                  <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare size={24} />
                  </div>
                  <p className="text-sm text-slate-500">
                    {user && user.id !== 'guest' ? t.chatbot.welcome : (user?.name ? t.chatbot.guestWelcome.replace('{name}', user.name) : t.chatbot.welcome)}
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-brand-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
                  }`}>
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
                    <Loader2 size={16} className="animate-spin text-brand-600" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t.chatbot.placeholder}
                className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-lg shadow-brand-100"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-brand-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group"
      >
        <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
};

// --- Pages ---

const LandingPage = ({ user }: { user: User | null }) => {
  const { t } = React.useContext(LanguageContext);
  return (
    <div className="pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-full text-sm font-medium border border-brand-100">
            <Shield size={16} />
            CareLink AI
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-tight whitespace-pre-line">
            {t.landing.heroTitle}
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto whitespace-pre-line">
            {t.landing.heroSub}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/upload" className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white rounded-2xl font-semibold text-lg hover:bg-brand-700 transition-all shadow-xl shadow-brand-200 flex items-center justify-center gap-2 group">
              {t.landing.startBtn}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            {!user && (
              <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-semibold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                {t.nav.login}
              </Link>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: t.landing.feature1Title, desc: t.landing.feature1Desc },
              { icon: Heart, title: t.landing.feature2Title, desc: t.landing.feature2Desc },
              { icon: TrendingUp, title: t.landing.feature3Title, desc: t.landing.feature3Desc }
            ].map((feature, i) => (
              <div key={i} className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow text-left space-y-4">
                <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const AuthPage = ({ type, onAuth, guestInfo }: { type: 'login' | 'signup'; onAuth: (user: User) => void; guestInfo?: User | null }) => {
  const navigate = useNavigate();
  const { t } = React.useContext(LanguageContext);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: guestInfo?.name || '',
    gender: (guestInfo?.gender as 'male' | 'female' | 'other') || 'male',
    age: guestInfo?.age || 30
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (type === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const newUser: User = {
          id: userCredential.user.uid,
          email: formData.email,
          name: formData.name,
          gender: formData.gender,
          age: formData.age
        };
        await saveUserToFirestore(newUser);
        onAuth(newUser);
        navigate('/mypage');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const userProfile = await getUserFromFirestore(userCredential.user.uid);
        if (userProfile) {
          onAuth(userProfile);
          navigate('/mypage');
        } else {
          setError(t.auth.errorProfile);
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError(t.auth.errorEmailInUse);
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError(t.auth.errorInvalid);
      } else {
        setError(t.auth.errorGeneric + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-slate-900">{type === 'login' ? t.auth.loginTitle : t.auth.signupTitle}</h2>
          <p className="text-slate-500">{type === 'login' ? t.auth.loginSub : t.auth.signupSub}</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'signup' && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">{t.auth.name}</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all"
                  placeholder={t.auth.namePlaceholder}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">{t.auth.gender}</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all"
                  >
                    <option value="male">{t.auth.male}</option>
                    <option value="female">{t.auth.female}</option>
                    <option value="other">{t.auth.other}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">{t.auth.age}</label>
                  <input
                    required
                    type="number"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>
            </>
          )}
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">{t.auth.email}</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all"
              placeholder="example@email.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">{t.auth.password}</label>
            <input
              required
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 mt-4 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : (type === 'login' ? t.nav.login : t.nav.signup)}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          {type === 'login' ? t.auth.noAccount : t.auth.hasAccount}
          <Link to={type === 'login' ? '/signup' : '/login'} className="ml-2 text-brand-600 font-semibold hover:underline">
            {type === 'login' ? t.nav.signup : t.nav.login}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

const UploadPage = ({ user, guestInfo: initialGuestInfo, onReportGenerated }: { user: User | null; guestInfo: User | null; onReportGenerated: (report: HealthReport, guest?: User) => void }) => {
  const navigate = useNavigate();
  const { t, lang } = React.useContext(LanguageContext);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ocr' | 'ai'>('idle');
  
  // 비회원용 정보 상태 (기존 정보가 있으면 초기값으로 사용)
  const [guestInfo, setGuestInfo] = useState({
    name: initialGuestInfo?.name || '',
    age: initialGuestInfo?.age || 30,
    gender: initialGuestInfo?.gender || 'male' as 'male' | 'female' | 'other'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const handleAnalyze = async () => {
    if (!preview || !file) return;
    
    // 비회원인 경우 이름 입력 확인
    if (!user && !guestInfo.name.trim()) {
      alert(t.upload.errorName);
      return;
    }

    setIsAnalyzing(true);
    setStatus('ocr');

    try {
      // Simulate OCR step
      await new Promise(r => setTimeout(r, 2000));
      setStatus('ai');
      
      const activeUser = user || { 
        id: 'guest', 
        name: guestInfo.name, 
        email: '', 
        gender: guestInfo.gender, 
        age: guestInfo.age 
      } as User;
      
      const report = await analyzeHealthCheckup(preview, file.type, activeUser, lang);
      onReportGenerated(report, !user ? activeUser : undefined);
      navigate('/report');
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message || "";
      if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('limit')) {
        const aistudio = (window as any).aistudio;
        if (aistudio) {
          const hasKey = await aistudio.hasSelectedApiKey();
          if (!hasKey) {
            if (window.confirm(t.upload.errorQuotaConfirm)) {
              await aistudio.openSelectKey();
              // Assume success and let user click again
              return;
            }
          }
        }
        alert(t.upload.errorQuota);
      } else {
        alert(t.upload.errorGeneric);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">{t.upload.title}</h1>
          <p className="text-slate-500 text-lg">{t.upload.sub}</p>
        </div>

        {/* 비회원 정보 입력 섹션 */}
        {!user && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
                <UserIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{t.upload.guestInfoTitle}</h3>
                <p className="text-xs text-slate-500">{t.upload.guestInfoSub}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">{t.auth.name}</label>
                <input 
                  type="text"
                  value={guestInfo.name}
                  onChange={e => setGuestInfo({ ...guestInfo, name: e.target.value })}
                  placeholder={t.auth.namePlaceholder}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">{t.auth.gender}</label>
                <select 
                  value={guestInfo.gender}
                  onChange={e => setGuestInfo({ ...guestInfo, gender: e.target.value as any })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                >
                  <option value="male">{t.auth.male}</option>
                  <option value="female">{t.auth.female}</option>
                  <option value="other">{t.auth.other}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">{t.auth.age}</label>
                <input 
                  type="number"
                  value={guestInfo.age}
                  onChange={e => setGuestInfo({ ...guestInfo, age: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                />
              </div>
            </div>
          </motion.div>
        )}

        <div className={`relative group border-2 border-dashed rounded-[2.5rem] transition-all ${
          preview ? 'border-brand-500 bg-brand-50/30' : 'border-slate-200 hover:border-brand-400 bg-slate-50 hover:bg-slate-100/50'
        }`}>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="p-12 text-center space-y-4">
            {preview ? (
              <div className="space-y-4">
                <div className="w-32 h-32 mx-auto bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center overflow-hidden">
                  {file?.type.includes('pdf') ? (
                    <FileText size={48} className="text-brand-600" />
                  ) : (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                </div>
                <p className="text-brand-700 font-medium">{file?.name}</p>
                <button onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null); }} className="text-sm text-red-500 hover:underline">{t.upload.removeFile}</button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-white text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                  <Upload size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-slate-900">{t.upload.dropzone}</p>
                  <p className="text-sm text-slate-500">{t.upload.dropzoneSub}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!file || isAnalyzing}
          className="w-full py-5 bg-brand-600 text-white rounded-2xl font-bold text-xl hover:bg-brand-700 transition-all shadow-xl shadow-brand-100 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              {status === 'ocr' ? t.upload.analyzingOCR : t.upload.analyzingAI}
            </>
          ) : (
            <>
              <Activity size={24} />
              {t.upload.analyzeBtn}
            </>
          )}
        </button>

        <div className="flex justify-center">
          <button 
            onClick={() => (window as any).aistudio?.openSelectKey()}
            className="text-sm text-slate-400 hover:text-brand-600 flex items-center gap-2 transition-colors"
          >
            <Shield size={14} />
            {t.upload.apiKeyHelp}
          </button>
        </div>
      </div>
    </div>
  );
};

const ReportPage = ({ report, user, onUpdateReport }: { report: HealthReport | null; user: User | null; onUpdateReport: (r: HealthReport) => void }) => {
  if (!report) return <Navigate to="/upload" />;
  const { t, lang } = React.useContext(LanguageContext);
  const [isEditing, setIsEditing] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [editedMetrics, setEditedMetrics] = useState<HealthMetric[]>(report.metrics);

  const handleTranslate = async () => {
    setIsTranslating(true);
    try {
      const { translateReport } = await import("./services/geminiService");
      const translated = await translateReport(report, lang);
      onUpdateReport(translated);
    } catch (error) {
      console.error("Translation failed:", error);
      alert(t.report.errorGeneric);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSaveMetrics = async () => {
    setIsReanalyzing(true);
    try {
      const { reanalyzeHealthMetrics } = await import("./services/geminiService");
      const updatedData = await reanalyzeHealthMetrics(editedMetrics, user!, lang);
      
      const updatedReport = { 
        ...report, 
        ...updatedData,
        metrics: updatedData.metrics || editedMetrics 
      };
      
      onUpdateReport(updatedReport as HealthReport);
      setIsEditing(false);
    } catch (error: any) {
      console.error("Reanalysis failed:", error);
      const errorMsg = error.message || "";
      if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('limit')) {
        alert(t.report.errorQuota);
      } else {
        alert(t.report.errorGeneric);
      }
    } finally {
      setIsReanalyzing(false);
    }
  };

  const updateMetric = (index: number, field: keyof HealthMetric, value: string) => {
    const newMetrics = [...editedMetrics];
    newMetrics[index] = { ...newMetrics[index], [field]: value };
    setEditedMetrics(newMetrics);
  };

  const addMetric = () => {
    setEditedMetrics([...editedMetrics, { name: '', value: 0, unit: '', status: 'normal', referenceRange: '' }]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'danger': return 'text-red-600 bg-red-50 border-red-100';
      case 'caution': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-brand-600 bg-brand-50 border-brand-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'danger': return t.report.danger;
      case 'caution': return t.report.caution;
      default: return t.report.normal;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-brand-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="pt-32 pb-20 px-4 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column: Summary & Score */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold text-slate-900">{t.report.title}</h1>
                  <p className="text-slate-500">{t.report.basedOn.replace('{date}', report.date)}</p>
                </div>
                <div className="text-right">
                  <div className={`text-5xl font-black ${getScoreColor(report.score)}`}>{report.score}</div>
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t.report.scoreLabel}</div>
                  {report.lang !== lang && (
                    <button 
                      onClick={handleTranslate}
                      disabled={isTranslating}
                      className="mt-2 text-[10px] font-bold text-brand-600 hover:underline flex items-center justify-end gap-1 ml-auto"
                    >
                      {isTranslating ? <Loader2 size={10} className="animate-spin" /> : <Globe size={10} />}
                      {lang === 'ko' ? '한국어로 번역' : 'Translate to English'}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Brain size={20} className="text-brand-600" />
                  {t.report.aiSummary}
                </h3>
                <p className="text-slate-700 leading-relaxed">{report.summary}</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Activity size={20} className="text-brand-600" />
                    {t.report.metricsTitle}
                  </h3>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <Plus size={16} />
                    {t.report.editMetrics}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {report.metrics.map((m, i) => (
                    <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-2 hover:border-brand-100 transition-colors">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-slate-500">{getTranslatedMetricName(m.name, t)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(m.status)}`}>
                          {getStatusText(m.status)}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900">{m.value}</span>
                        <span className="text-xs text-slate-400 font-medium">{m.unit}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{t.report.normalRange}: {m.referenceRange}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Action Plan */}
          <div className="space-y-8">
            <div className="bg-brand-600 p-8 rounded-[2.5rem] shadow-xl text-white space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 size={24} />
                {t.report.actionPlan}
              </h3>
              
              <div className="space-y-6">
                <section className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-brand-200">{t.report.diet}</h4>
                  <ul className="space-y-2">
                    {report.actionPlan.diet.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="mt-1.5 w-1.5 h-1.5 bg-brand-300 rounded-full shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-brand-200">{t.report.exercise}</h4>
                  <ul className="space-y-2">
                    {report.actionPlan.exercise.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="mt-1.5 w-1.5 h-1.5 bg-brand-300 rounded-full shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-brand-200">{t.report.lifestyle}</h4>
                  <ul className="space-y-2">
                    {report.actionPlan.lifestyle.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="mt-1.5 w-1.5 h-1.5 bg-brand-300 rounded-full shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>

                {report.actionPlan.medicalAdvice && (
                  <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                    <p className="text-xs font-medium italic">"{report.actionPlan.medicalAdvice}"</p>
                  </div>
                )}
              </div>
            </div>

            <Link to="/presentation" className="flex items-center justify-center gap-2 w-full py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm">
              <Presentation size={20} className="text-brand-600" />
              {t.report.presentationMode}
            </Link>

            {( !user || user.id === 'guest' ) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white space-y-6 border border-white/10"
              >
                <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center">
                  <Plus size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{t.report.saveTitle}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {t.report.saveSub}
                  </p>
                </div>
                <Link 
                  to="/signup" 
                  className="flex items-center justify-center gap-2 w-full py-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
                >
                  {t.report.saveBtn}
                  <ArrowRight size={18} />
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Edit Metrics Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">{t.report.modalTitle}</h3>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {editedMetrics.map((m, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="sm:col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">{t.report.metricName}</label>
                      <input 
                        type="text" 
                        value={m.name} 
                        onChange={e => updateMetric(i, 'name', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">{t.report.metricValue}</label>
                      <input 
                        type="number" 
                        value={m.value} 
                        onChange={e => updateMetric(i, 'value', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">{t.report.metricUnit}</label>
                      <input 
                        type="text" 
                        value={m.unit} 
                        onChange={e => updateMetric(i, 'unit', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        placeholder={t.report.unitPlaceholder}
                      />
                    </div>
                  </div>
                ))}
                <button 
                  onClick={addMetric}
                  className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-brand-300 hover:text-brand-600 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  {t.report.addMetric}
                </button>
              </div>

              <div className="p-6 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  {t.auth.cancel}
                </button>
                <button 
                  onClick={handleSaveMetrics}
                  disabled={isReanalyzing}
                  className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isReanalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t.report.reanalyzing}
                    </>
                  ) : (
                    t.report.saveAndReanalyze
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MyPage = ({ user, reports, onSelectReport }: { user: User; reports: HealthReport[]; onSelectReport: (r: HealthReport) => void }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const navigate = useNavigate();
  const { t, lang } = React.useContext(LanguageContext);

  const chartData = [...reports].reverse().map(r => ({
    date: r.date,
    score: r.score,
    bloodSugar: r.metrics.find(m => m.name.includes('혈당') || m.name.toLowerCase().includes('blood sugar'))?.value || 0,
    cholesterol: r.metrics.find(m => m.name.includes('콜레스테롤') || m.name.toLowerCase().includes('cholesterol'))?.value || 0,
  }));

  const handleRowClick = (report: HealthReport) => {
    onSelectReport(report);
    navigate('/report');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-brand-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'danger': return 'text-red-600 bg-red-50 border-red-100';
      case 'caution': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-brand-600 bg-brand-50 border-brand-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'danger': return t.report.danger;
      case 'caution': return t.report.caution;
      default: return t.report.normal;
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
              <UserIcon size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{user.name}{t.mypage.titleSuffix}</h1>
              <p className="text-slate-500">{user.age}{t.auth.ageUnit} · {user.gender === 'male' ? t.auth.male : t.auth.female}</p>
            </div>
          </div>
          <div className="flex bg-slate-200/50 p-1 rounded-xl backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {t.mypage.tabDashboard}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {t.mypage.tabHistory}
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={24} className="text-brand-600" />
                  {t.mypage.scoreTrend}
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        itemStyle={{fontWeight: 'bold', color: '#0d9488'}}
                      />
                      <Area type="monotone" dataKey="score" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
                  <h3 className="text-lg font-bold text-slate-900">{t.mypage.bloodSugarTrend}</h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" hide />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                        <Tooltip />
                        <Line type="monotone" dataKey="bloodSugar" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b'}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
                  <h3 className="text-lg font-bold text-slate-900">{t.mypage.cholesterolTrend}</h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" hide />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                        <Tooltip />
                        <Line type="monotone" dataKey="cholesterol" stroke="#0d9488" strokeWidth={3} dot={{r: 4, fill: '#0d9488'}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
                <h3 className="text-xl font-bold text-slate-900">{t.mypage.recentStatus}</h3>
                {reports.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">{t.mypage.date}</span>
                      <span className="font-bold text-slate-900">{reports[0].date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">{t.mypage.score}</span>
                      <span className={`text-2xl font-black ${getScoreColor(reports[0].score)}`}>{reports[0].score}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{reports[0].summary}</p>
                    </div>
                    <Link to="/report" className="flex items-center justify-center w-full py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-100">
                      {t.mypage.viewDetail}
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                      <FileText size={24} />
                    </div>
                    <p className="text-sm text-slate-400">{t.mypage.noReports}</p>
                    <Link to="/upload" className="inline-block text-sm font-bold text-brand-600 hover:underline">{t.mypage.firstUpload}</Link>
                  </div>
                )}
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white space-y-6 border border-white/10">
                <h3 className="text-xl font-bold">{t.mypage.healthTipTitle}</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                      <Heart size={16} className="text-brand-400" />
                    </div>
                    <p className="text-sm text-slate-400">{t.mypage.tip1}</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                      <Activity size={16} className="text-brand-400" />
                    </div>
                    <p className="text-sm text-slate-400">{t.mypage.tip2}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{t.mypage.date}</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{t.mypage.score}</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{t.mypage.mainStatus}</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">{t.mypage.manage}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r, i) => (
                  <tr 
                    key={i} 
                    onClick={() => handleRowClick(r)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-8 py-6 font-bold text-slate-900">{r.date}</td>
                    <td className="px-8 py-6">
                      <span className={`text-lg font-black ${getScoreColor(r.score)}`}>
                        {r.score}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-2">
                        {r.metrics.filter(m => m.status !== 'normal').slice(0, 2).map((m, j) => (
                          <span key={j} className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(m.status)}`}>
                            {getTranslatedMetricName(m.name, t)} {getStatusText(m.status)}
                          </span>
                        ))}
                        {r.metrics.every(m => m.status === 'normal') && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border text-brand-600 bg-brand-50 border-brand-100">
                            {t.mypage.allNormal}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 text-slate-300 group-hover:text-brand-600 transition-colors">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-zinc-400">{t.mypage.noHistory}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const PresentationMode = ({ report }: { report: HealthReport | null }) => {
  const [slide, setSlide] = useState(0);
  const { t } = React.useContext(LanguageContext);
  const navigate = useNavigate();

  if (!report) return <Navigate to="/upload" />;

  const slides = [
    {
      title: t.presentation.scoreTitle,
      content: (
        <div className="flex flex-col items-center justify-center h-full space-y-8">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-zinc-100" />
              <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray={754} strokeDashoffset={754 - (754 * report.score) / 100} className="text-brand-500 transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-7xl font-black text-zinc-900">{report.score}</span>
              <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{t.report.scoreLabel}</span>
            </div>
          </div>
          <p className="text-2xl text-zinc-600 text-center max-w-2xl font-medium">"{report.summary}"</p>
        </div>
      )
    },
    {
      title: t.presentation.riskTitle,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full items-center">
          <div className="space-y-6">
            {report.metrics.filter(m => m.status !== 'normal').map((m, i) => (
              <div key={i} className={`p-6 rounded-3xl border-2 ${m.status === 'danger' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'} space-y-2`}>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-zinc-900">{getTranslatedMetricName(m.name, t)}</span>
                  <AlertCircle className={m.status === 'danger' ? 'text-red-500' : 'text-amber-500'} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-zinc-900">{m.value}</span>
                  <span className="text-lg text-zinc-500">{m.unit}</span>
                </div>
                <p className="text-sm text-zinc-600">{t.report.normalRange}: {m.referenceRange}</p>
              </div>
            ))}
            {report.metrics.filter(m => m.status !== 'normal').length === 0 && (
              <div className="p-12 text-center bg-brand-50 rounded-[3rem] border-2 border-brand-100">
                <CheckCircle2 size={64} className="text-brand-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-brand-900">{t.presentation.allNormal}</h3>
              </div>
            )}
          </div>
          <div className="bg-zinc-100 rounded-[3rem] p-12 flex items-center justify-center">
             <Activity size={120} className="text-zinc-300" />
          </div>
        </div>
      )
    },
    {
      title: t.presentation.planTitle,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-center">
          {[
            { title: t.report.diet, items: report.actionPlan.diet, color: "bg-brand-500" },
            { title: t.report.exercise, items: report.actionPlan.exercise, color: "bg-blue-500" },
            { title: t.report.lifestyle, items: report.actionPlan.lifestyle, color: "bg-purple-500" }
          ].map((section, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-zinc-100 h-full space-y-6">
              <div className={`w-12 h-12 ${section.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                {i === 0 ? <Heart size={24} /> : i === 1 ? <Activity size={24} /> : <Brain size={24} />}
              </div>
              <h3 className="text-2xl font-bold text-zinc-900">{section.title}</h3>
              <ul className="space-y-4">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-lg text-zinc-600">
                    <div className={`mt-2 w-2 h-2 ${section.color} rounded-full shrink-0`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-50 flex flex-col">
      <div className="p-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">{slides[slide].title}</h2>
            <p className="text-sm text-zinc-400">{t.presentation.slide} {slide + 1} {t.presentation.of} {slides.length}</p>
          </div>
        </div>
        <button onClick={() => navigate('/report')} className="p-3 bg-white border border-zinc-200 rounded-2xl hover:bg-zinc-100 transition-all">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 px-8 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full"
          >
            {slides[slide].content}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <button
          disabled={slide === 0}
          onClick={() => setSlide(s => s - 1)}
          className="p-4 bg-white border border-zinc-200 rounded-2xl disabled:opacity-30 hover:bg-zinc-100 transition-all shadow-lg"
        >
          {t.presentation.prev}
        </button>
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${slide === i ? 'w-8 bg-brand-600' : 'w-2 bg-zinc-200'}`} />
          ))}
        </div>
        <button
          disabled={slide === slides.length - 1}
          onClick={() => setSlide(s => s + 1)}
          className="p-4 bg-brand-600 text-white rounded-2xl disabled:opacity-30 hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
        >
          {t.presentation.next}
        </button>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [guestInfo, setGuestInfo] = useState<User | null>(null);
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [currentReport, setCurrentReport] = useState<HealthReport | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [lang, setLang] = useState<Language>('ko');

  const t = translations[lang];

  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await getUserFromFirestore(firebaseUser.uid);
        if (userProfile) {
          setUser(userProfile);
          setGuestInfo(null); // 회원 로그인 시 비회원 정보 초기화
          const userReports = await getReportsFromFirestore(firebaseUser.uid);
          setReports(userReports);
          setCurrentReport(userReports[0] || null);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
        setReports([]);
        setCurrentReport(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleAuth = async (u: User) => {
    setUser(u);
    setGuestInfo(null);
    // 비회원 상태에서 생성된 리포트가 있다면 회원가입 즉시 저장
    if (currentReport) {
      const existingReports = await getReportsFromFirestore(u.id);
      const isAlreadySaved = existingReports.some(r => r.id === currentReport.id);
      
      if (!isAlreadySaved) {
        await saveReportToFirestore(u.id, currentReport);
        const updatedReports = await getReportsFromFirestore(u.id);
        setReports(updatedReports);
      } else {
        setReports(existingReports);
      }
    } else {
      const userReports = await getReportsFromFirestore(u.id);
      setReports(userReports);
      setCurrentReport(userReports[0] || null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setGuestInfo(null);
      setReports([]);
      setCurrentReport(null);
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
    }
  };

  const handleReportGenerated = async (report: HealthReport, guest?: User) => {
    if (guest) {
      setGuestInfo(guest);
    }

    if (user) {
      await saveReportToFirestore(user.id, report);
      const updatedReports = await getReportsFromFirestore(user.id);
      setReports(updatedReports);
      setCurrentReport(report);
    } else {
      setCurrentReport(report);
      setReports(prev => [report, ...prev]);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 size={48} className="animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 selection:bg-brand-100 selection:text-brand-900">
          <Navbar user={user} onLogout={handleLogout} />
          
          <main>
            <Routes>
              <Route path="/" element={<LandingPage user={user} />} />
              <Route path="/login" element={user ? <Navigate to="/mypage" /> : <AuthPage type="login" onAuth={handleAuth} guestInfo={guestInfo} />} />
              <Route path="/signup" element={user ? <Navigate to="/mypage" /> : <AuthPage type="signup" onAuth={handleAuth} guestInfo={guestInfo} />} />
              
              {/* Routes */}
              <Route path="/upload" element={<UploadPage user={user} guestInfo={guestInfo} onReportGenerated={handleReportGenerated} />} />
              <Route path="/report" element={<ReportPage report={currentReport} user={user || guestInfo} onUpdateReport={handleReportGenerated} />} />
              <Route path="/mypage" element={user ? <MyPage user={user} reports={reports} onSelectReport={setCurrentReport} /> : <Navigate to="/login" />} />
              <Route path="/presentation" element={<PresentationMode report={currentReport} />} />
            </Routes>
          </main>

          <Chatbot user={user || guestInfo} reports={reports} />

          <footer className="py-12 border-t border-zinc-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                  <Activity size={18} />
                </div>
                <span className="text-lg font-bold tracking-tight">CareLink</span>
              </div>
              <p className="text-sm text-zinc-400">{t.footer.rights}</p>
              <div className="flex justify-center gap-6 text-xs font-medium text-zinc-400">
                <a href="#" className="hover:text-zinc-900 transition-colors">{t.footer.privacy}</a>
                <a href="#" className="hover:text-zinc-900 transition-colors">{t.footer.terms}</a>
                <a href="#" className="hover:text-zinc-900 transition-colors">{t.footer.contact}</a>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </LanguageContext.Provider>
  );
}
