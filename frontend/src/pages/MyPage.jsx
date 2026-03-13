import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, FileText, Calendar, MessageSquare, Settings, Heart, ChevronRight, TrendingUp, Bot, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MyPage() {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [history, setHistory] = useState([]);
    const [availableYears, setAvailableYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('carelink_token');
            const yearsRes = await axios.get('http://localhost:5000/api/reports/years', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (yearsRes.data.success) {
                const years = yearsRes.data.data.availableYears;
                setAvailableYears(years);

                if (years.length > 0) {
                    await fetchReport(years[0]);
                    setSelectedYear(years[0]);
                }
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReport = async (year) => {
        try {
            const token = localStorage.getItem('carelink_token');
            const res = await axios.get(`http://localhost:5000/api/reports/health?year=${year}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setReportData(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching report:', err);
        }
    };

    if (loading && !reportData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f9f7f0]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
                    <p className="font-bold text-slate-400">당신의 건강 데이터를 분석 중입니다...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#f9f7f0]">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-orange-100 hidden lg:flex flex-col sticky top-0 h-screen">
                <div className="p-8">
                    <Link to="/" className="text-2xl font-extrabold text-teal-600 flex items-center gap-2">
                        <Heart className="w-8 h-8 fill-current" />
                        CareLink
                    </Link>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <Link to="/mypage" className="flex items-center gap-3 px-4 py-3 bg-teal-50 text-teal-600 rounded-xl font-bold">
                        <Activity className="w-5 h-5" /> 건강 대시보드
                    </Link>
                    <Link to="/report" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-all">
                        <FileText className="w-5 h-5" /> 검진 기록
                    </Link>
                    <Link to="/chatbot" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-all">
                        <MessageSquare className="w-5 h-5" /> AI 챗봇
                    </Link>
                    <Link to="/profile/edit" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-all">
                        <Settings className="w-5 h-5" /> 회원 정보 수정
                    </Link>
                </nav>
                <div className="p-4 border-t border-slate-100">
                    <button onClick={logout} className="w-full py-3 text-slate-400 font-bold hover:text-red-500 transition-all text-sm">
                        로그아웃
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900">대시보드</h1>
                        <p className="text-slate-500 font-medium">{user?.name}님, 분석된 최근 건강 상태입니다.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {availableYears.length > 0 && (
                            <select
                                className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                value={selectedYear}
                                onChange={(e) => {
                                    const y = e.target.value;
                                    setSelectedYear(y);
                                    fetchReport(y);
                                }}
                            >
                                {availableYears.map(y => <option key={y} value={y}>{y}년 검진</option>)}
                            </select>
                        )}
                        <Link to="/upload" className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-md">
                            데이터 추가
                        </Link>
                    </div>
                </header>

                {!reportData ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-orange-100">
                        <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-600">아직 분석된 데이터가 없습니다.</h2>
                        <p className="text-slate-400 mt-2">건강검진 결과지를 업로드하여 AI 분석을 시작하시겠습니까?</p>
                        <Link to="/upload" className="inline-block mt-8 bg-teal-600 text-white px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-transform">
                            업로드하러 가기
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Health Score Card */}
                        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-orange-50">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-1">종합 건강 점수</h2>
                                    <p className="text-slate-400 text-sm">AI 정밀 분석 결과</p>
                                </div>
                                <div className="flex items-center gap-1 text-teal-600 font-bold">
                                    <TrendingUp className="w-4 h-4" /> 안정적
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row items-center gap-12">
                                <div className="relative w-48 h-48 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="96" cy="96" r="88" fill="none" stroke="#f1f5f9" strokeWidth="16" />
                                        <circle
                                            cx="96" cy="96" r="88" fill="none" stroke="#0d9488" strokeWidth="16"
                                            strokeDasharray={552.92}
                                            strokeDashoffset={552.92 * (1 - reportData.healthRecord.health_score / 100)}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000"
                                        />
                                    </svg>
                                    <div className="absolute text-center">
                                        <span className="text-5xl font-black text-slate-900">{reportData.healthRecord.health_score}</span>
                                        <p className="text-slate-400 font-bold text-sm">점</p>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4 w-full">
                                    <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100">
                                        <p className="text-teal-700 font-bold text-sm mb-1">AI 코멘트</p>
                                        <p className="text-teal-600/80 text-xs leading-relaxed">
                                            {reportData.aiReport.summary.substring(0, 100)}...
                                        </p>
                                    </div>
                                    <Link to={`/report?year=${selectedYear}`} className="flex items-center justify-between w-full p-4 bg-slate-50 rounded-2xl text-slate-600 font-bold hover:bg-slate-100 transition-all text-sm font-bold">
                                        상세 건강 리포트 보기 <ChevronRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Quick Shortcuts */}
                        <div className="space-y-8">
                            <Link to="/action-plan" className="block group">
                                <div className="bg-teal-600 p-8 rounded-3xl shadow-lg group-hover:bg-teal-700 transition-all transform group-hover:-translate-y-1">
                                    <Activity className="w-10 h-10 text-white/80 mb-6" />
                                    <h3 className="text-xl font-bold text-white mb-2">액션 플랜</h3>
                                    <p className="text-white/70 text-sm font-medium">건강 개선을 위한 맞춤 미션을 확인하고 실행하세요.</p>
                                </div>
                            </Link>
                            <Link to="/chatbot" className="block group">
                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-orange-50 group-hover:shadow-md transition-all transform group-hover:-translate-y-1">
                                    <Bot className="w-10 h-10 text-teal-500 mb-6" />
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">AI 건강 상담</h3>
                                    <p className="text-slate-500 text-sm font-medium">검진 결과에 대해 궁금한 점을 1:1로 질문하세요.</p>
                                </div>
                            </Link>
                        </div>

                        {/* Health Trend Chart */}
                        <div className="lg:col-span-3 bg-white p-8 rounded-3xl shadow-sm border border-orange-50">
                            <h2 className="text-xl font-bold text-slate-900 mb-8">건강 상태 추이</h2>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={history}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                        <YAxis hide domain={[0, 100]} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ color: '#0d9488', fontWeight: 'bold' }}
                                        />
                                        <Line type="monotone" dataKey="score" stroke="#0d9488" strokeWidth={4} dot={{ r: 6, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
