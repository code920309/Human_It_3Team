import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { CheckCircle2, Circle, Trophy, Flame, Target, BookOpen, Utensils, Footprints, Loader2, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ActionPlanPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await api.get('/action-plans/current');
            if (res.data.success) {
                setPlans(res.data.data);
            }
        } catch (err) {
            setError('활동 계획을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const toggleComplete = async (plan) => {
        try {
            const newStatus = !plan.is_completed;
            
            // Optimistic Update
            setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_completed: newStatus } : p));

            await api.patch(`/action-plans/${plan.id}/toggle`, { is_completed: newStatus });
        } catch (err) {
            // Revert on error
            setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_completed: !plan.is_completed } : p));
        }
    };

    const getIcon = (category) => {
        switch (category) {
            case 'diet': return <Utensils className="w-6 h-6" />;
            case 'exercise': return <Footprints className="w-6 h-6" />;
            case 'lifestyle': return <Flame className="w-6 h-6" />;
            default: return <Target className="w-6 h-6" />;
        }
    };

    const getDifficultyColor = (diff) => {
        switch (diff) {
            case 'easy': return 'bg-teal-50 text-teal-600';
            case 'medium': return 'bg-amber-50 text-amber-600';
            case 'hard': return 'bg-red-50 text-red-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f9f7f0]">
                <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
            </div>
        );
    }

    const completedCount = plans.filter(p => p.is_completed).length;
    const progress = plans.length > 0 ? (completedCount / plans.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-[#f9f7f0] p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center mb-10">
                    <Link to="/mypage" className="p-2 hover:bg-white rounded-full transition-all mr-2 group">
                        <ChevronLeft className="w-6 h-6 text-slate-400 group-hover:text-teal-600" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">나의 액션 플랜</h1>
                        <p className="text-slate-500 font-medium">AI가 추천하는 개인 맞춤형 건강 미션입니다.</p>
                    </div>
                </header>

                {/* Progress Card */}
                <div className="bg-slate-900 text-white rounded-3xl p-8 mb-10 shadow-xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <span className="text-teal-400 font-bold text-xs uppercase tracking-widest mb-2 block">Weekly Milestone</span>
                            <h2 className="text-5xl font-black mb-2">{Math.round(progress)}%</h2>
                            <p className="text-slate-400 text-sm font-medium">이번 주 미션 {completedCount}개를 달성했습니다!</p>
                        </div>
                        <div className="w-24 h-24 bg-teal-600/20 rounded-full flex items-center justify-center border-4 border-teal-600/30">
                            <Trophy className={`w-12 h-12 ${progress === 100 ? 'text-teal-400 animate-bounce' : 'text-slate-600'}`} />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 h-2 bg-slate-800 w-full">
                        <div 
                            className="h-full bg-teal-500 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(20,184,166,0.5)]" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Mission List */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center ml-2">
                        <h3 className="text-xl font-bold text-slate-900">오늘의 미션</h3>
                        <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-orange-50 uppercase tracking-widest">{plans.length} Missions</span>
                    </div>
                    
                    {plans.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-orange-50 shadow-sm">
                            <Target className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">건강 리포트를 완료하면 맞춤 미션이 시작됩니다.</p>
                            <Link to="/upload" className="inline-block mt-6 text-teal-600 font-bold text-sm hover:underline">리포트 생성하러 가기</Link>
                        </div>
                    ) : (
                        plans.map((plan) => (
                            <div 
                                key={plan.id}
                                className={`group bg-white rounded-3xl p-7 border transition-all cursor-pointer flex items-center gap-6 ${plan.is_completed ? 'border-teal-100 opacity-60' : 'border-orange-50 hover:border-teal-300 shadow-sm hover:shadow-md active:scale-[0.98]'}`}
                                onClick={() => toggleComplete(plan)}
                            >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 shadow-sm ${plan.is_completed ? 'bg-teal-500 text-white' : 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white'}`}>
                                    {plan.is_completed ? <CheckCircle2 className="w-8 h-8" /> : getIcon(plan.category)}
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${getDifficultyColor(plan.difficulty)}`}>
                                            {plan.difficulty}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                            {plan.category}
                                        </span>
                                    </div>
                                    <h4 className={`text-xl font-bold ${plan.is_completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                        {plan.title}
                                    </h4>
                                    <p className={`text-sm font-medium mt-1 leading-relaxed ${plan.is_completed ? 'text-slate-300' : 'text-slate-500'}`}>
                                        {plan.content}
                                    </p>
                                </div>

                                <div className={`shrink-0 transition-all duration-300 ${plan.is_completed ? 'text-teal-500 scale-110' : 'text-slate-100 group-hover:text-teal-200'}`}>
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Info Tip */}
                <div className="mt-14 bg-teal-600 rounded-3xl p-8 flex gap-6 items-center text-white shadow-xl shadow-teal-600/10">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white shrink-0 backdrop-blur-md border border-white/30">
                        <BookOpen className="w-7 h-7" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold">전문가의 건강 팁</h4>
                        <p className="text-sm text-teal-50 mt-1 font-medium leading-relaxed opacity-90">
                            매일 작은 습관을 실천하고 기록하는 것만으로도 장기적인 건강 지표가 20% 이상 개선될 수 있습니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
