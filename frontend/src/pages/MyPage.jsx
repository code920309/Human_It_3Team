import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Heart, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Components
import HealthScoreCard from '../components/dashboard/HealthScoreCard';
import HealthTrendChart from '../components/dashboard/HealthTrendChart';
import HealthReportCard from '../components/dashboard/HealthReportCard';
import ActionPlanCard from '../components/dashboard/ActionPlanCard';
import QuickMenu from '../components/dashboard/QuickMenu';

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
                    
                    // Mock history data based on years
                    const mockHistory = years.map((y, i) => ({
                        date: `${y}년`,
                        score: 80 + Math.floor(Math.random() * 15)
                    })).reverse();
                    setHistory(mockHistory);
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
        <div className="flex flex-col min-h-screen bg-[#f9f7f0]">
            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="text-2xl font-extrabold text-teal-600 flex items-center gap-2">
                                <Heart className="w-8 h-8 fill-current" />
                                CareLink
                            </Link>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <Link to="/mypage" className="text-teal-600 transition-colors font-bold">건강 대시보드</Link>
                            <Link to="/report" className="text-slate-600 hover:text-teal-600 transition-colors font-semibold">검진 기록</Link>
                            <Link to="/chatbot" className="text-slate-600 hover:text-teal-600 transition-colors font-semibold">AI 챗봇</Link>
                            <button 
                                onClick={logout}
                                className="bg-teal-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-teal-700 transition-all shadow-md"
                            >
                                로그아웃
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Content Header */}
            <div className="max-w-7xl mx-auto w-full px-6 md:px-12 pt-12">
                <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 text-center md:text-left">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">마이페이지</h1>
                        <p className="text-slate-500 font-medium">환영합니다, <span className="text-teal-600 font-bold">{user?.name}</span>님. 오늘의 분석 리포트입니다.</p>
                    </div>
                    <QuickMenu />
                </header>

                {!reportData ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl p-16 text-center border border-orange-100 shadow-sm"
                    >
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <ArrowRight className="w-10 h-10 text-slate-300" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-4">아직 분석된 데이터가 없습니다.</h2>
                        <p className="text-slate-500 max-w-md mx-auto mb-10 leading-relaxed font-medium">
                            건강검진 결과지를 업로드하여 AI 분석을 받고 맞춤형 리포트와 액션 플랜을 받아보세요.
                        </p>
                        <Link to="/upload" className="inline-flex items-center gap-3 bg-teal-600 text-white px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-transform shadow-lg">
                            데이터 업로드하기 <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8 pb-16 items-start">
                        {/* Row 1 Full Width: AI Summary */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="lg:col-span-2 bg-white p-8 rounded-3xl border border-orange-50 shadow-sm"
                        >
                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider">AI 코멘트</h3>
                            <p className="text-slate-600 text-sm leading-relaxed font-medium">
                                {reportData?.aiReport?.summary || "건강 데이터 분석 데이터가 충분하지 않습니다."}
                            </p>
                        </motion.div>

                        {/* Row 2: Health Score & Report Card */}
                        <div className="h-[450px]">
                            <HealthScoreCard 
                                score={reportData?.healthRecord?.health_score || 0} 
                                change={5} 
                                status="안정적" 
                            />
                        </div>
                        <div className="h-[450px]">
                            <HealthReportCard />
                        </div>

                        {/* Row 3: Health Trend & Action Plan */}
                        <div className="h-[350px]">
                            <HealthTrendChart history={history} />
                        </div>
                        <div className="h-[350px]">
                            <ActionPlanCard />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer mirroring HomePage */}
            <footer className="max-w-7xl mx-auto w-full mt-auto mb-12 px-6 md:px-12 pt-8 border-t border-orange-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 uppercase tracking-widest font-bold">
                <span>CareLink Health Analytics v2.0</span>
                <span>© 2026 CareLink Systems. All Rights Reserved.</span>
            </footer>
        </div>
    );
}
