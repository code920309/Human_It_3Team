import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Heart, Mail, Lock, ArrowRight, Check, AlertCircle } from 'lucide-react';
import InputForm from '../components/auth/InputForm';

/**
 * 로그인 페이지
 * [충돌해결] 프리미엄 UI 디자인은 그대로 유지하되, 세션 기반 인증 로직(loginOption 연동)을 최적화했습니다.
 */
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginOption, setLoginOption] = useState('none'); // 'none', 'keep', 'save_id'
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    /**
     * 마운트 시 로컬스토리지에서 저장된 아이디 불러오기
     */
    useEffect(() => {
        const savedEmail = localStorage.getItem('carelink_saved_id');
        if (savedEmail) {
            setEmail(savedEmail);
            setLoginOption('save_id');
        }
    }, []);

    /**
     * 로그인 처리 함수
     * [충돌해결] loginOption의 값('keep')을 AuthContext의 keepLoggedIn 파라미터로 전달합니다.
     */
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const loginPayload = { 
            email: email.trim().toLowerCase(), 
            password,
            loginOption 
        };
        
        try {
            const res = await api.post('/auth/login', loginPayload);
            if (res.data.success) {
                // 아이디 저장 로직 처리 (최적화)
                if (loginOption === 'save_id') {
                    localStorage.setItem('carelink_saved_id', email.trim().toLowerCase());
                } else {
                    localStorage.removeItem('carelink_saved_id');
                }

                /* [수정] loginOption이 'keep'일 때만 로그인 상태를 유지하도록 전달 */
                const keepLoggedIn = (loginOption === 'keep');
                login(res.data.token, res.data.user, keepLoggedIn);
                navigate('/mypage');
            } else {
                setError(res.data.message || '로그인에 실패했습니다.');
            }
        } catch (err) {
            setError(err.response?.data?.message || '로그인 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 옵션 체크/체크 해제 토글
     */
    const toggleOption = (option) => {
        setLoginOption(prev => prev === option ? 'none' : option);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#f9f7f0]">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-orange-50"
            >
                <div className="p-10">
                    <div className="text-center mb-10">
                        <Link to="/" className="inline-flex items-center gap-2 text-3xl font-black text-teal-600 mb-4 transition-transform hover:scale-105">
                            <Heart className="w-10 h-10 fill-current" />
                            CareLink
                        </Link>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">다시 오신 것을 환영합니다</h2>
                        <p className="text-slate-500 font-medium mt-2">오늘도 당신의 건강 데이터를 확인해보세요</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-2 animate-shake">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <InputForm 
                            icon={Mail}
                            type="email"
                            id="email"
                            placeholder="이메일 주소"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        
                        <InputForm 
                            icon={Lock}
                            type="password"
                            id="password"
                            placeholder="비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {/* 옵션 선택 UI (아이디 저장 / 로그인 유지) */}
                        <div className="flex items-center justify-between px-1 py-1">
                            <div className="flex gap-4">
                                <label className="flex items-center cursor-pointer group">
                                    <div 
                                        onClick={() => toggleOption('keep')}
                                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all 
                                        ${loginOption === 'keep' ? 'bg-teal-600 border-teal-600' : 'border-slate-300 bg-white group-hover:border-teal-400'}`}
                                    >
                                        {loginOption === 'keep' && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                                    </div>
                                    <span className="ml-2 text-xs font-bold text-slate-500 select-none group-hover:text-teal-600" onClick={() => toggleOption('keep')}>로그인 유지</span>
                                </label>

                                <label className="flex items-center cursor-pointer group">
                                    <div 
                                        onClick={() => toggleOption('save_id')}
                                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all 
                                        ${loginOption === 'save_id' ? 'bg-teal-600 border-teal-600' : 'border-slate-300 bg-white group-hover:border-teal-400'}`}
                                    >
                                        {loginOption === 'save_id' && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                                    </div>
                                    <span className="ml-2 text-xs font-bold text-slate-500 select-none group-hover:text-teal-600" onClick={() => toggleOption('save_id')}>아이디 저장</span>
                                </label>
                            </div>
                            <Link to="#" className="text-xs font-bold text-slate-400 hover:text-teal-600 transition-colors">
                                비밀번호 찾기
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-5 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:transform-none disabled:shadow-none mt-4 text-lg"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    확인 중...
                                </span>
                            ) : (
                                <>로그인하기 <ArrowRight className="w-6 h-6" /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center border-t border-slate-100 pt-8">
                        <p className="text-slate-500 font-medium">
                            아직 회원이 아니신가요?{' '}
                            <Link to="/signup" className="text-teal-600 font-black hover:underline underline-offset-4 decoration-2">
                                빠른 회원가입
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
