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
        className="bg-white p-6 rounded-3xl border border-teal-100 h-full flex flex-col justify-between group relative overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
        id="action-plan-card"
      >
        {/* 식단 및 운동 배경 이미지 - 선명함 극대화 */}
        <div 
          className="absolute inset-0 opacity-70 group-hover:opacity-100 transition-opacity duration-700 ease-in-out scale-110 group-hover:scale-100"
          style={{ 
            backgroundImage: `url('/action_plan_bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(1.15) contrast(1.1)'
          }}
        />

        {/* 오버레이 투명화 조정 - 이미지 가독성 우선 */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/75 via-white/40 to-transparent z-0 group-hover:from-white/50 transition-colors duration-500" />
        
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-teal-100/80 backdrop-blur-sm shadow-md rounded-2xl group-hover:bg-teal-200 transition-all duration-300">
              <ClipboardList className="text-teal-600" size={26} />
            </div>
            <ArrowRight className="text-teal-500 group-hover:text-teal-700 transition-all transform group-hover:translate-x-1" size={24} />
          </div>
          
          <div className="backdrop-blur-[1.5px] bg-white/30 p-2.5 -m-2.5 rounded-xl border border-white/20 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight drop-shadow-md">맞춤형 액션 플랜</h2>
            <p className="text-slate-800 text-sm leading-relaxed font-black">
              건강 점수를 높이기 위해 제안된 당신만의 건강 개선 루틴을 실천하세요.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-teal-700 font-extrabold text-sm group-hover:gap-4 transition-all uppercase tracking-widest bg-white/50 px-3 py-1.5 rounded-full w-fit">
              플랜 확인하기
              <ArrowRight size={20} />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default ActionPlanCard;
