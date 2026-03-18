import React from 'react';
import { ChevronLeft, ChevronRight, Settings, PlusSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuickMenu = () => {
  return (
    <div className="flex items-center gap-2" id="quick-actions">
      <Link 
        to="/upload"
        className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-teal-50 hover:text-teal-600 transition-all text-slate-400"
        title="데이터 업로드"
      >
        <PlusSquare size={20} />
      </Link>
      <Link 
        to="/report"
        className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-teal-50 hover:text-teal-600 transition-all text-slate-400"
        title="검진 기록"
      >
        <ChevronLeft size={20} />
      </Link>
      <Link 
        to="/action-plan"
        className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-teal-50 hover:text-teal-600 transition-all text-slate-400"
        title="액션 플랜"
      >
        <ChevronRight size={20} />
      </Link>
      <Link 
        to="/profile/edit"
        className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-teal-50 hover:text-teal-600 transition-all text-slate-400"
        title="회원정보수정"
      >
        <Settings size={20} />
      </Link>
    </div>
  );
};

export default QuickMenu;
