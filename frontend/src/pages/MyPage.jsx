import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
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
    // 상태 관리 (State Management)
    const { user, logout } = useAuth(); // 인증 정보 및 로그아웃 함수
    const [loading, setLoading] = useState(true); // 로딩 상태
    const [reportData, setReportData] = useState(null); // 검진 리포트 데이터
    const [history, setHistory] = useState([]); // 건강 점수 히스토리
    const [availableYears, setAvailableYears] = useState([]); // 조회 가능한 연도 목록
    const [selectedYear, setSelectedYear] = useState(null); // 현재 선택된 연도

    // 컴포넌트 마운트 시 초기 데이터 로드 (mount point)
    useEffect(() => {
        fetchInitialData();
    }, []);

    // 초기 데이터(연도 목록 등)를 가져오는 비동기 함수
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 사용 가능한 검진 연도 목록 API 호출
            const yearsRes = await api.get('/reports/years');
            if (yearsRes.data.success) {
                const years = yearsRes.data.data.availableYears;
                setAvailableYears(years);

                if (years.length > 0) {
                    // 최신 연도의 리포트 데이터를 우선적으로 호출
                    await fetchReport(years[0]);
                    setSelectedYear(years[0]);

                    // 연도별 점수 히스토리 생성 (데이터 시뮬레이션을 위한 임시 로직)
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

    // 특정 연도의 상세 건강 리포트 데이터를 호출하는 함수
    const fetchReport = async (year) => {
        try {
            const res = await api.get(`/reports/health?year=${year}`);
            if (res.data.success) {
                setReportData(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching report:', err);
        }
    };

    // 화면 로딩 중일 때 표시되는 컴포넌트
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
            {/* 상단 내비게이션 바: 로고, 메뉴, 로그아웃 버튼 포함 */}
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

            {/* 메인 본문 영역 */}
            <div className="max-w-7xl mx-auto w-full px-6 md:px-12 pt-12">
                {/* 헤더 섹션: 타이틀 및 유저 인사말 */}
                <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 text-center md:text-left">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">마이페이지</h1>
                        <p className="text-slate-500 font-medium">환영합니다, <span className="text-teal-600 font-bold">{user?.name}</span>님. 오늘의 분석 리포트입니다.</p>
                    </div>
                    <QuickMenu />
                </header>

                {!reportData ? (
                    // 데이터가 없을 때 표시되는 섹션 (Empty State)
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
                    // 리포트 데이터가 있을 때의 대시보드 레이아웃
                    <div className="flex flex-col gap-8 pb-16">
                        {/* 상단: AI 코멘트 섹션 (가로 100%) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full bg-white p-8 rounded-3xl border border-orange-50 shadow-sm"
                        >
                            <h3 className="text-sm font-bold text-teal-600 uppercase mb-4 tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                                AI 건강 코멘트
                            </h3>
                            <p className="text-slate-700 text-lg leading-relaxed font-semibold">
                                {reportData?.aiReport?.summary || "건강 데이터 분석 데이터가 충분하지 않습니다."}
                            </p>
                        </motion.div>

                        {/* 그리드 레이아웃 (65:35) */}
                        <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8">
                            {/* 왼쪽 영역: 65% */}
                            <div className="flex flex-col gap-8">
                                <div className="h-[400px]">
                                    <HealthScoreCard
                                        score={reportData?.healthRecord?.health_score || 0}
                                        change={5}
                                        status="안정적"
                                    />
                                </div>
                                <div className="h-[400px]">
                                    <HealthTrendChart history={history} />
                                </div>
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="h-[400px] bg-white p-8 rounded-3xl border border-orange-100 shadow-sm flex flex-col"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-black text-slate-900">상세 건강 지표</h3>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase">Details</span>
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                        <div className="bg-orange-50/50 rounded-2xl p-5 border border-orange-100/50 flex flex-col justify-center">
                                            <p className="text-xs font-bold text-slate-400 mb-1">혈압</p>
                                            <p className="text-2xl font-black text-slate-900">{reportData?.healthRecord?.blood_pressure_s}/{reportData?.healthRecord?.blood_pressure_d} <span className="text-sm font-medium text-slate-500">mmHg</span></p>
                                        </div>
                                        <div className="bg-teal-50/50 rounded-2xl p-5 border border-teal-100/50 flex flex-col justify-center">
                                            <p className="text-xs font-bold text-slate-400 mb-1">공복 혈당</p>
                                            <p className="text-2xl font-black text-slate-900">{reportData?.healthRecord?.fasting_glucose} <span className="text-sm font-medium text-slate-500">mg/dL</span></p>
                                        </div>
                                        <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50 flex flex-col justify-center">
                                            <p className="text-xs font-bold text-slate-400 mb-1">허리둘레</p>
                                            <p className="text-2xl font-black text-slate-900">{reportData?.healthRecord?.waist} <span className="text-sm font-medium text-slate-500">cm</span></p>
                                        </div>
                                        <div className="bg-purple-50/50 rounded-2xl p-5 border border-purple-100/50 flex flex-col justify-center">
                                            <p className="text-xs font-bold text-slate-400 mb-1">체질량지수 (BMI)</p>
                                            <p className="text-2xl font-black text-slate-900">{reportData?.healthRecord?.bmi} <span className="text-sm font-medium text-slate-500">kg/㎡</span></p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* 오른쪽 영역: 35% */}
                            <div className="flex flex-col gap-8">
                                <div className="h-[620px]">
                                    <HealthReportCard selectedYear={selectedYear} />
                                </div>
                                <div className="h-[620px]">
                                    <ActionPlanCard />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 하단 푸터 영역 */}
            <footer className="max-w-7xl mx-auto w-full mt-auto mb-12 px-6 md:px-12 pt-8 border-t border-orange-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 uppercase tracking-widest font-bold">
                <span>CareLink Health Analytics v2.0</span>
                <span>© 2026 CareLink Systems. All Rights Reserved.</span>
            </footer>
        </div>
    );
}
