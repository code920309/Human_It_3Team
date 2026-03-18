import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Heart, ChevronLeft, User, Mail, Lock, Phone, Calendar, Save, Trash2, CheckCircle2 } from 'lucide-react';

export default function ProfileEdit() {
  const [activeTab, setActiveTab] = useState('basic');
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    gender: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /* [수정] 비밀번호 변경을 위한 상태 관리용 변수 추가 */
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      /* [수정] 내 정보 불러오기 주소를 /auth/me 로 정정 */
      const res = await api.get('/auth/me');
      const data = res.data.data; // Note: adjusted to res.data.data if that's the response structure
      setUser(data);
      setFormData({
        name: data.name,
        birth_date: data.birth_date ? data.birth_date.substring(0, 10) : '',
        gender: data.gender,
        phone: data.phone || '',
        email: data.email
      });
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      /* [수정] 실제 DB 반영을 위해 API PUT 요청 호출 */
      const res = await api.put('/auth/update-profile', formData);
      
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Update failed:', err);
      alert('프로필 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /* [수정] 비밀번호 실제 변경 요청 핸들러 함수 구현 */
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return alert('새 비밀번호가 일치하지 않습니다.');
    }
    if (passwordData.newPassword.length < 10) {
      return alert('새 비밀번호는 최소 10자 이상이어야 합니다.');
    }

    setLoading(true);
    try {
      const res = await api.put('/auth/update-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (res.data.success) {
        setSuccess(true);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Password update failed:', err);
      alert(err.response?.data?.message || '비밀번호 변경 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f7f0] pb-20">
      <header className="bg-white border-b border-orange-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/mypage" className="flex items-center gap-2 text-slate-600 font-bold hover:text-teal-600 transition-all">
            <ChevronLeft className="w-6 h-6" /> 뒤로가기
          </Link>
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-teal-600" />
            <h1 className="text-xl font-black text-slate-900">회원 정보 수정</h1>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-12">
        <div className="flex gap-4 mb-8 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: 'basic', label: '기본 정보', icon: User },
            { id: 'password', label: '비밀번호 변경', icon: Lock },
            { id: 'email', label: '이메일 변경', icon: Mail }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-sm ${activeTab === tab.id ? 'bg-teal-600 text-white shadow-teal-600/20' : 'bg-white text-slate-400 border border-orange-50 hover:bg-slate-50'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-orange-50">
          {success && (
            <div className="mb-8 p-4 bg-teal-50 border border-teal-100 text-teal-600 rounded-2xl flex items-center gap-3 font-bold animate-fadeInDown">
              <CheckCircle2 className="w-5 h-5" /> 성공적으로 변경되었습니다.
            </div>
          )}

          {activeTab === 'basic' && (
            <form onSubmit={handleUpdate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">이름</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-700 transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">생년월일</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-700 transition-all" value={formData.birth_date} onChange={(e) => setFormData({...formData, birth_date: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">성별</label>
                  <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-200">
                    <button type="button" onClick={() => setFormData({...formData, gender: 'M'})} className={`flex-1 py-3.5 rounded-xl font-bold transition-all ${formData.gender === 'M' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}>남성</button>
                    <button type="button" onClick={() => setFormData({...formData, gender: 'F'})} className={`flex-1 py-3.5 rounded-xl font-bold transition-all ${formData.gender === 'F' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}>여성</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">전화번호</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-700 transition-all" value={formData.phone} placeholder="010-0000-0000" onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white font-black py-5 rounded-2xl shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 hover:bg-teal-700 transition-all active:scale-95 disabled:opacity-50">
                {loading ? <CheckCircle2 className="w-6 h-6 animate-pulse" /> : <Save className="w-6 h-6" />}
                변경 사항 저장하기
              </button>
              <div className="pt-8 border-t border-slate-100 flex justify-center">
                <button type="button" className="text-red-300 font-bold text-sm flex items-center gap-2 hover:text-red-500 transition-all group">
                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> 회원 탈퇴하기
                </button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-md mx-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">현재 비밀번호</label>
                  <input 
                    type="password" 
                    required
                    placeholder="현재 비밀번호를 입력하세요" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-teal-500 font-medium transition-all" 
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">새 비밀번호</label>
                  <input 
                    type="password" 
                    required
                    placeholder="새 비밀번호 (10자 이상, 대/소문자/숫자/기호)" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-teal-500 font-medium transition-all" 
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">새 비밀번호 확인</label>
                  <input 
                    type="password" 
                    required
                    placeholder="비밀번호를 다시 입력하세요" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-teal-500 font-medium transition-all" 
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white font-black py-5 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-teal-700 transition-all mt-8 disabled:opacity-50">
                <Lock className="w-5 h-5" /> 비밀번호 변경 완료
              </button>
            </form>
          )}

          {activeTab === 'email' && (
            <form className="space-y-6 max-w-md mx-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">현재 이메일</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input type="email" disabled className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-400 font-medium" value={formData.email} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">새 이메일 주소</label>
                  <div className="flex gap-2">
                    <input type="email" placeholder="new-email@health.com" className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-teal-500 font-medium transition-all" />
                    <button type="button" className="px-6 bg-teal-50 text-teal-600 font-black rounded-2xl border border-teal-100 hover:bg-teal-100 transition-all text-sm">인증 요청</button>
                  </div>
                </div>
              </div>
              <button type="button" className="w-full bg-teal-600 text-white font-black py-5 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-teal-700 transition-all mt-8">
                <Mail className="w-5 h-5" /> 이메일 주소 변경
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
