import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Activity } from 'lucide-react';

const HealthScoreCard = ({ score, prevScore }) => {
  const scoreDiff = score - prevScore;
  const isPositive = scoreDiff >= 0;
  
  // 점수에 따른 테마 색상 결정
  const getScoreTheme = (s) => {
    if (s >= 80) return { color: '#0d9488', label: '최상 (Excellent)', bg: 'bg-teal-500' };
    if (s >= 60) return { color: '#f59e0b', label: '보통 (Stable)', bg: 'bg-amber-500' };
    return { color: '#ef4444', label: '주의 (Caution)', bg: 'bg-red-500' };
  };

  const theme = getScoreTheme(score);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-8 rounded-3xl shadow-sm border border-orange-50 h-full flex flex-col justify-between relative overflow-hidden group"
      id="health-score-card"
    >
      {/* 프리미엄 배경 그라데이션 레이어 */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-teal-100/40 transition-colors duration-700" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-2">종합 건강 점수</h2>
            <div className="flex items-baseline gap-4">
              <span className="text-8xl font-black tracking-tighter text-slate-900 drop-shadow-sm select-none">
                {score}
              </span>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-sm ${isPositive ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-600'}`}>
                {isPositive ? <TrendingUp size={14} strokeWidth={3} /> : <Activity size={14} strokeWidth={3} />}
                <span>{isPositive ? `+${scoreDiff}` : scoreDiff} 점</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full text-white uppercase tracking-widest ${theme.bg} shadow-md`}>
              {theme.label}
            </span>
          </div>
        </div>

        {/* 고도화된 프로그레스 바 영역 */}
        <div className="mt-8">
          <div className="flex justify-between items-end mb-3">
            <span className="text-xs font-black text-slate-500 flex items-center gap-1.5">
              <Target size={14} className="text-teal-500" />
              목표 점수 도달률
            </span>
            <span className="text-sm font-black text-slate-900">85%</span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner p-[2px]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '85%' }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.3)]"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4 text-xs font-bold text-slate-400 border-t border-slate-50 pt-6 relative z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
          <span>전월 대비 {isPositive ? '상승' : '하락'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span>동일 연령대 상위 12%</span>
        </div>
      </div>
    </motion.div>
  );
};

export default HealthScoreCard;
