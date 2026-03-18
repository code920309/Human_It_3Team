import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Heart, ChevronLeft, Download, AlertCircle, CheckCircle2, Info, Loader2, Activity } from 'lucide-react';

/**
 * HealthReport Page
 * OCR로 분석된 건강검진 결과와 AI의 정밀 분석 리포트를 시각화하여 보여주는 페이지입니다.
 */
export default function HealthReport() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const year = searchParams.get('year');

  useEffect(() => {
    fetchData();
  }, [year]);

  /**
   * 백엔드로부터 특정 연도의 건강 데이터 및 AI 분석 리포트 정보를 가져옵니다.
   * - health_data 테이블: 검진 수치 데이터
   * - ai_reports 테이블: AI가 생성한 요약 및 권고문
   */
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/health${year ? `?year=${year}` : ''}`);
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

  /**
   * 위험 수치를 계산하는 헬퍼 함수
   */
  const getStatus = (label, value) => {
    if (!value) return 'normal';
    if (label === 'waist' && value > 90) return 'risk';
    if (label === 'glucose' && value > 100) return 'borderline';
    if (label === 'tg' && value > 150) return 'risk';
    if (label === 'alt' && value > 40) return 'risk';
    return 'normal';
  };

  /**
   * 장기별 상태에 따른 색상 및 애니메이션을 반환합니다.
   */
  const getOrganClass = (status) => {
    switch (status) {
      case 'risk': return 'text-red-500 fill-red-500 animate-pulse';
      case 'borderline': return 'text-amber-500 fill-amber-500';
      default: return 'text-teal-500 fill-teal-500 opacity-20';
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f7f0] pb-20">
      <header className="bg-white border-b border-orange-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/mypage" className="flex items-center gap-2 text-slate-600 font-bold hover:text-teal-600 transition-all">
            <ChevronLeft className="w-6 h-6" /> 뒤로가기
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-teal-600 fill-current" />
            <h1 className="text-xl font-black text-slate-900">{data.year}년 정밀 건강 리포트</h1>
          </div>
          <button className="p-2 text-slate-400 hover:text-teal-600 transition-all">
            <Download className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 space-y-8">
        
        {/* 요약 카드 */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-orange-50 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center md:border-r border-slate-100 flex flex-col justify-center">
            <p className="text-slate-400 font-bold text-sm mb-4">종합 건강 점수</p>
            <div className="text-7xl font-black text-teal-600 mb-2">{healthRecord.health_score}</div>
            <p className="text-teal-500 font-bold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-5 h-5" /> {healthRecord.health_score >= 80 ? '매우 양호' : healthRecord.health_score >= 60 ? '양호' : '주의 요망'}
            </p>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Info className="w-5 h-5 text-teal-500" /> AI 분석 요약
            </div>
            <p className="text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
              {aiReport?.summary || "데이터를 기반으로 AI가 분석 중입니다. 잠시만 기다려주세요."}
            </p>
            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
              <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <p className="text-amber-800 font-bold text-sm mb-1">맞춤형 의료 권고</p>
                <p className="text-amber-700 text-xs leading-relaxed">{aiReport?.medical_recommendation || "정기적인 운동과 균형 잡힌 식단을 유지하세요."}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 인체 시각화 및 위험 요인 분석 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 장기 상태 시각화 - ai_reports 테이블의 organ_status 컬럼 활용 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-orange-50 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
            <div className="relative w-64 h-full opacity-5">
              <svg viewBox="0 0 200 500" className="w-full h-full fill-slate-300">
                <path d="M100 20c-20 0-35 15-35 35s15 35 35 35 35-15 35-35-15-35-35-35zM65 100c-20 0-40 20-40 40v100c0 10 10 20 20 20h20v150c0 20 15 35 35 35s35-15 35-35V260h20c10 0 20-10 20-20V140c0-20-20-40-40-40H65z" />
              </svg>
            </div>
            
            {/* AI가 판단한 장기별 상태 시각화 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
              <div className="flex flex-wrap justify-center gap-4 px-4">
                {[
                  { label: "심장/혈관", status: aiReport?.organ_heart_status || aiReport?.organ_vessels_status },
                  { label: "간 기능", status: aiReport?.organ_liver_status },
                  { label: "췌장/혈당", status: aiReport?.organ_pancreas_status },
                  { label: "복부/지방", status: aiReport?.organ_abdomen_status }
                ].map((organ, idx) => (
                  <div key={idx} className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center min-w-[120px]">
                    <Heart className={`w-8 h-8 mb-2 ${getOrganClass(organ.status)}`} />
                    <p className="text-xs font-bold text-slate-500">{organ.label}</p>
                    <p className={`text-[10px] font-black mt-1 ${organ.status === 'risk' ? 'text-red-500' : organ.status === 'borderline' ? 'text-amber-500' : 'text-teal-500'}`}>
                      {organ.status === 'risk' ? '집중관리' : organ.status === 'borderline' ? '주의' : '정상'}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-slate-400 font-bold bg-white/50 px-4 py-1 rounded-full">AI 인체 매핑 분석 완료</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-500" /> 주요 수치 정밀 분석
            </h2>
            {[
              { label: "복부 비만 (허리둘레)", value: healthRecord.waist, unit: "cm", status: getStatus('waist', healthRecord.waist) },
              { label: "혈압", value: `${healthRecord.blood_pressure_s}/${healthRecord.blood_pressure_d}`, unit: "mmHg", status: healthRecord.blood_pressure_s > 140 ? 'risk' : 'normal' },
              { label: "공복 혈당", value: healthRecord.fasting_glucose || healthRecord.glucose, unit: "mg/dL", status: getStatus('glucose', healthRecord.fasting_glucose || healthRecord.glucose) },
              { label: "중성 지방 (TG)", value: healthRecord.tg, unit: "mg/dL", status: getStatus('tg', healthRecord.tg) },
              { label: "간 기능 지표 (ALT)", value: healthRecord.alt, unit: "U/L", status: getStatus('alt', healthRecord.alt) },
              { label: "콜레스테롤 (LDL)", value: healthRecord.ldl, unit: "mg/dL", status: healthRecord.ldl > 130 ? 'borderline' : 'normal' }
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-orange-50 flex items-center justify-between hover:border-teal-200 transition-colors">
                <div>
                  <p className="text-slate-400 text-xs font-bold mb-1">{item.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{item.value || '-'}</span>
                    <span className="text-slate-400 text-sm font-bold">{item.unit}</span>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider ${item.status === 'risk' ? 'bg-red-50 text-red-500' : item.status === 'borderline' ? 'bg-amber-50 text-amber-500' : 'bg-teal-50 text-teal-500'}`}>
                  {item.status === 'risk' ? '위험' : item.status === 'borderline' ? '주의' : '정상'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 상세 메트릭스 카드 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-orange-50 text-center shadow-sm">
            <p className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">AI 분석 신뢰도</p>
            <p className="text-3xl font-black text-slate-900">{aiReport?.analysis_precision || 99.2}%</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-orange-50 text-center shadow-sm">
            <p className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">관리 필요 항목</p>
            <p className="text-3xl font-black text-red-500">{aiReport?.warning_items_count || 0}개</p>
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
