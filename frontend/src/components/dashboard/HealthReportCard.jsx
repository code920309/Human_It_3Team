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
        className="bg-slate-900 p-8 rounded-3xl shadow-lg h-full flex flex-col justify-between text-white group"
        id="health-report-card"
      >
        <div className="flex justify-between items-start">
          <div className="p-3 bg-white/10 rounded-2xl">
            <FileText className="text-teal-400" size={24} />
          </div>
          <ArrowRight className="text-white/30 group-hover:text-white transition-colors" size={20} />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-2">AI 정밀 분석 리포트</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            최근 건강검진 데이터를 기반으로 한 개인 맞춤형 건강 리포트를 확인하세요.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-teal-400 font-bold text-sm">
            리포트 보기
            <ArrowRight size={16} />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default HealthReportCard;
