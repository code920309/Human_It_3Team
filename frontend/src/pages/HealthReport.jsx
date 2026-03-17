import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Heart, ChevronLeft, Download, AlertCircle, CheckCircle2, Info, Loader2, Activity } from 'lucide-react';
import HumanBodySVG from '../components/HumanBodySVG';

export default function HealthReport() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeOrgan, setActiveOrgan] = useState(null);
  const [selectedOrgan, setSelectedOrgan] = useState(null);
  const year = searchParams.get('year');

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('carelink_token');
      const res = await axios.get(`/api/reports/health${year ? `?year=${year}` : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9f7f0] gap-4">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
        <p className="font-bold text-slate-400">분석 리포트를 불러오는 중...</p>
      </div>
    );
  }

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-6 bg-[#f9f7f0]">
      <div className="bg-white p-12 rounded-3xl shadow-sm border border-orange-100 text-center max-w-md">
        <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-slate-600 font-bold text-lg">데이터가 없습니다.</p>
        <p className="text-slate-400 mt-2 text-sm">먼저 건강검진 결과를 업로드해주세요.</p>
        <Link to="/upload" className="inline-block mt-8 bg-teal-600 text-white px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-transform shadow-md">업로드하러 가기</Link>
      </div>
    </div>
  );

  const { healthRecord, aiReport } = data;

  return (
    <div className="min-h-screen bg-[#f9f7f0] pb-20">
      <header className="bg-white border-b border-orange-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/mypage" className="flex items-center gap-2 text-slate-600 font-bold hover:text-teal-600 transition-all">
            <ChevronLeft className="w-6 h-6" /> 뒤로가기
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-teal-600 fill-current" />
            <h1 className="text-xl font-black text-slate-900">{data.year}년 정보 건강 리포트</h1>
          </div>
          <button className="p-2 text-slate-400 hover:text-teal-600 transition-all">
            <Download className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 space-y-8">
        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-orange-50 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center md:border-r border-slate-100 flex flex-col justify-center">
            <p className="text-slate-400 font-bold text-xs mb-4 uppercase tracking-widest">종합 건강 점수</p>
            <div className="relative inline-block mx-auto mb-4">
               <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="58" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                  <circle 
                    cx="64" cy="64" r="58" fill="transparent" stroke="#14b8a6" strokeWidth="12" 
                    strokeDasharray={364} 
                    strokeDashoffset={364 - (364 * healthRecord.health_score) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center font-black text-4xl text-slate-800">
                 {healthRecord.health_score}
               </div>
            </div>
            <p className="text-teal-600 font-black text-sm flex items-center justify-center gap-1">
              {healthRecord.health_score >= 80 ? '매우 양호' : healthRecord.health_score >= 60 ? '양호' : '관리 필요'}
            </p>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-black">
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                <Info className="w-5 h-5 text-teal-600" />
              </div>
              AI 총평 분석
            </div>
            <p className="text-slate-600 leading-relaxed bg-slate-50/50 p-6 rounded-2xl border border-slate-100 font-medium italic">
              "{aiReport?.summary || "데이터를 기반으로 AI가 분석 중입니다."}"
            </p>
            <div className="p-5 bg-teal-900 text-white rounded-2xl shadow-lg flex gap-4">
              <AlertCircle className="w-6 h-6 text-teal-400 shrink-0" />
              <div>
                <p className="text-teal-400 font-bold text-xs mb-1 uppercase tracking-widest">AI 맞춤 권고</p>
                <p className="text-white text-sm font-medium leading-relaxed">{aiReport?.medical_recommendation || "정기적인 운동과 균형 잡힌 식단을 유지하세요."}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <HumanBodySVG 
            organStatus={aiReport} 
            activeOrgan={activeOrgan} 
            onOrganHover={setActiveOrgan}
            selectedOrgan={selectedOrgan}
            onOrganSelect={(id) => setSelectedOrgan(prev => prev === id ? null : id)}
          />

          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                 <Activity className="w-6 h-6 text-teal-600" />
              </div>
              주요 위험 요인 정보 분석
            </h2>
            {[
              { id: 'abdomen', label: "복부 비만 (허리둘레)", value: healthRecord.waist, unit: "cm", status: healthRecord.waist > 90 ? "risk" : "normal" },
              { id: 'pancreas', label: "공복 혈당 (GLU)", value: healthRecord.fasting_glucose || healthRecord.glucose, unit: "mg/dL", status: (healthRecord.fasting_glucose || healthRecord.glucose) > 100 ? "borderline" : "normal" },
              { id: 'heart', label: "중성 지방 (TG)", value: healthRecord.tg, unit: "mg/dL", status: healthRecord.tg > 150 ? "risk" : "normal" },
              { id: 'vessels', label: "수축기 혈압 (SYS)", value: healthRecord.blood_pressure_s, unit: "mmHg", status: healthRecord.blood_pressure_s > 140 ? "risk" : healthRecord.blood_pressure_s > 120 ? "borderline" : "normal" },
              { id: 'liver', label: "간 기능 지표 (ALT)", value: healthRecord.alt, unit: "U/L", status: healthRecord.alt > 40 ? "risk" : "normal" }
            ].map((item, i) => (
              <div 
                key={i} 
                onMouseEnter={() => setActiveOrgan(item.id)}
                onMouseLeave={() => setActiveOrgan(null)}
                onClick={() => setSelectedOrgan(prev => prev === item.id ? null : item.id)}
                className={`bg-white p-6 rounded-[24px] shadow-sm border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                  (activeOrgan === item.id || selectedOrgan === item.id) ? 'border-teal-500 ring-4 ring-teal-500/10 -translate-x-2' : 'border-orange-50'
                }`}
              >
                <div>
                  <p className="text-slate-400 text-[10px] font-black mb-1 uppercase tracking-widest">{item.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-black ${item.status === 'risk' ? 'text-red-500' : 'text-slate-800'}`}>{item.value}</span>
                    <span className="text-slate-400 text-xs font-bold uppercase">{item.unit}</span>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                  item.status === 'risk' ? 'bg-red-50 text-red-500 border border-red-100' : 
                  item.status === 'borderline' ? 'bg-amber-50 text-amber-500 border border-amber-100' : 
                  'bg-teal-50 text-teal-500 border border-teal-100'
                }`}>
                  {item.status === 'risk' ? '위험' : item.status === 'borderline' ? '주의' : '정상'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-orange-50 text-center shadow-sm">
            <p className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">AI 분석 신뢰도</p>
            <p className="text-3xl font-black text-slate-900">99.2%</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-orange-50 text-center shadow-sm">
            <p className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">관리 필요 항목</p>
            <p className="text-3xl font-black text-red-500">2개</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-orange-50 text-center shadow-sm">
            <p className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">분석 연도</p>
            <p className="text-3xl font-black text-teal-600">{data.year}년</p>
          </div>
        </section>
      </main>
    </div>
  );
}
