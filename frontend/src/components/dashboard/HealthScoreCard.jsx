import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const HealthScoreCard = ({ score, change, status }) => {
  const isPositive = change >= 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-3xl shadow-sm border border-orange-50 h-full flex flex-col justify-between"
      id="health-score-card"
    >
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">종합 건강 점수</h2>
        <div className="flex items-baseline gap-4">
          <span className="text-8xl font-black tracking-tighter text-slate-900">{score}</span>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${isPositive ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'}`}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{isPositive ? '+' : ''}{change} 점 (전월 대비)</span>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-slate-600">상태: <span className="text-teal-600">{status}</span></span>
          <span className="text-xs text-slate-400">목표: 90+</span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${score > 80 ? 'bg-teal-500' : score > 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default HealthScoreCard;
