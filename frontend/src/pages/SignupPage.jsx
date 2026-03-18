import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Heart, Mail, Lock, User, Calendar, ArrowRight, ShieldCheck, AlertCircle, ChevronRight } from 'lucide-react';

/* MERGED FROM 업로드OCR: 게스트 데이터 연동 및 자동 로그인 로직 통합 */

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    birth_date: '',
    gender: 'M'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // 비회원 분석 데이터가 있을 경우 폼에 미리 채우기
  useEffect(() => {
    if (location.state?.guestName) {
      let calculatedBirthDate = '';
      if (location.state.guestAge) {
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - parseInt(location.state.guestAge);
        calculatedBirthDate = `${birthYear}-01-01`;
      }

      setFormData(prev => ({
        ...prev,
        name: location.state.guestName,
        gender: location.state.guestGender || prev.gender,
        birth_date: calculatedBirthDate || prev.birth_date
      }));
    }
  }, [location.state]);

  const handleRequestOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/signup/request-otp', { email });
      if (res.data.success) {
        setIsOtpSent(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP 발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/signup/verify-otp', { email, otp });
      if (res.data.success) {
        setIsEmailVerified(true);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || '인증번호가 유효하지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // [보안 지침 준수] 비밀번호 정책 검증 (Human_It_3Team-main 기반)
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{10,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('비밀번호는 최소 10자이며 영문과 숫자를 모두 포함해야 합니다.');
      setLoading(false);
      return;
    }

    try {
      // 1. 회원가입 프로세스
      const signupRes = await api.post('/auth/signup', {
        email,
        ...formData
      });

      if (signupRes.data.success) {
        // 2. 가입 시 자동 로그인을 위해 로그인 API 호출
        const loginRes = await api.post('/auth/login', {
            email,
            password: formData.password
        });

        if (loginRes.data.success) {
          // AuthContext에 로그인 정보를 넘겨 전역 로그인 상태로 전환
          // Human_It의 login 함수는 (token, user, keepLoggedIn) 형태
          login(loginRes.data.accessToken, loginRes.data.user, true);

          // 3. 비회원 분석 기록이 있다면 가입된 계정으로 저장(Save) 시도
          if (location.state?.guestData && location.state?.aiReport) {
            try {
              await api.post('/reports/save', {
                year: location.state.year || new Date().getFullYear(),
                healthRecord: location.state.guestData,
                aiReport: location.state.aiReport
              });
              console.log('✅ 비회원 분석 리포트가 성공적으로 저장되었습니다.');
            } catch (saveErr) {
              console.error('❌ 분석 기록 저장 실패:', saveErr);
            }
          }

          alert('회원가입이 완료되었습니다! 분석 기록이 내 계정에 안전하게 저장되었습니다.');
          navigate('/mypage'); 
        } else {
          alert('회원가입이 완료되었습니다. 로그인을 진행해주세요.');
          navigate('/login');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 bg-[#f9f7f0]">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-orange-50">
        <div className="p-8">
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex items-center gap-2 text-3xl font-extrabold text-teal-600 mb-4">
              <Heart className="w-10 h-10 fill-current" />
              CareLink
            </Link>
            <h2 className="text-2xl font-bold text-slate-900">{step === 1 ? '새로운 시작' : '회원 정보 입력'}</h2>
            <p className="text-slate-500">CareLink와 함께 건강 관리를 시작하세요</p>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${step >= 1 ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'}`}>1</div>
            <div className={`h-0.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-teal-600' : 'bg-slate-100'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${step >= 2 ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2</div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">이메일 주소</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      disabled={isEmailVerified}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      placeholder="example@health.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleRequestOtp}
                    disabled={loading || isEmailVerified || !email}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 rounded-2xl font-bold transition-all disabled:opacity-50 whitespace-nowrap text-sm"
                  >
                    {isOtpSent ? '재발령' : '인증요청'}
                  </button>
                </div>
              </div>

              {isOtpSent && (
                <div className="space-y-2 animate-fadeInUp">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">인증번호</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        maxLength={8}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-teal-500 outline-none transition-all font-bold tracking-widest text-center"
                        placeholder="인증번호 8자리"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={handleVerifyOtp}
                      disabled={loading || otp.length < 8}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-6 rounded-2xl font-bold transition-all disabled:opacity-50"
                    >
                      확인
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  placeholder="이름"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  placeholder="비밀번호 (10자 이상, 영문+숫자)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'M' })}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all border ${formData.gender === 'M' ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                >
                  남성
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'F' })}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all border ${formData.gender === 'F' ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                >
                  여성
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? '가입 중...' : '가입하기'} <ChevronRight className="w-5 h-5" />
              </button>
            </form>
          )}

          <div className="mt-10 text-center">
            <p className="text-slate-500">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-teal-600 font-bold hover:underline">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
