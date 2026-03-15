import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ActionPlanCard = () => {
  return (
    <Link to="/action-plan" className="block h-full">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.02 }}
        className="bg-teal-50 p-8 rounded-3xl border border-teal-100 h-full flex flex-col justify-between group"
        id="action-plan-card"
      >
        <div className="flex justify-between items-start">
          <div className="p-3 bg-teal-100 rounded-2xl">
            <ClipboardList className="text-teal-600" size={24} />
          </div>
          <ArrowRight className="text-teal-300 group-hover:text-teal-600 transition-colors" size={20} />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">맞춤형 액션 플랜</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            건강 점수를 높이기 위해 제안된 당신만의 건강 개선 루틴을 실천하세요.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-teal-600 font-bold text-sm">
            플랜 확인하기
            <ArrowRight size={16} />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default ActionPlanCard;
