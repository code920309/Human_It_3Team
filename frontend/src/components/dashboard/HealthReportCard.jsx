import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HealthReportCard = ({ selectedYear }) => {
  const reportLink = selectedYear ? `/report?year=${selectedYear}` : '/report';
  return (
    <Link to={reportLink} className="block h-full">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.02 }}
        className="bg-slate-900 p-6 rounded-3xl shadow-xl h-full flex flex-col justify-between text-white group relative overflow-hidden ring-1 ring-white/10"
        id="health-report-card"
      >
        {/* 스타일리시한 배경 이미지 - 호버 시 더 밝게 */}
        <div 
          className="absolute inset-0 opacity-40 group-hover:opacity-100 transition-opacity duration-700 ease-in-out"
          style={{ 
            backgroundImage: `url('/health_report_bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            mixBlendMode: 'screen'
          }}
        />
        
        {/* 콘텐츠 레이어 */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg">
              <FileText className="text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" size={26} />
            </div>
            <ArrowRight className="text-white/40 group-hover:text-white transition-all transform group-hover:translate-x-1" size={22} />
          </div>
          
          <div className="bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent p-2 -m-2 rounded-xl backdrop-blur-[2px]">
            <h2 className="text-2xl font-black mb-3 tracking-tight text-white drop-shadow-md">AI 정밀 분석 리포트</h2>
            <p className="text-slate-100/80 text-sm leading-relaxed font-bold">
              최근 건강검진 데이터를 기반으로 한 개인 맞춤형 건강 리포트를 확인하세요.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-teal-400 font-black text-sm group-hover:text-teal-300 transition-colors">
              리포트 보기
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default HealthReportCard;
