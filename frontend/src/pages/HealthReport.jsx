import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Heart, ChevronLeft, Download, AlertCircle, CheckCircle2, Info, Loader2, Activity, X } from 'lucide-react';
import HumanBodySVG from '../components/HumanBodySVG';

/**
 * HealthReport Page
 * OCR로 분석된 건강검진 결과와 AI의 정밀 분석 리포트를 시각화하여 보여주는 페이지입니다.
 */
export default function HealthReport() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeOrgan, setActiveOrgan] = useState(null);
  const [selectedOrgan, setSelectedOrgan] = useState(null);
  const [popupData, setPopupData] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
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
      // year이 없으면 현재 연도 사용
      const queryYear = year || new Date().getFullYear();
      const res = await api.get(`/reports/health?year=${queryYear}`);
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
   * 건강 데이터를 기반으로 장기별 상태를 계산
   * heart: 혈압 기반, liver: ALT 기반, pancreas: 공복혈당 기반, vessels: 혈압/혈당 기반, abdomen: 허리둘레 기반
   */
  const calculateOrganStatus = () => {
    const organStatus = {};
    
    // 심장/혈관: 혈압 및 콜레스테롤 기반
    const bpSys = healthRecord.blood_pressure_s;
    const bpDia = healthRecord.blood_pressure_d;
    if (bpSys > 160 || bpDia > 100) {
      organStatus.heart = 'risk';
      organStatus.vessels = 'risk';
    } else if (bpSys > 140 || bpDia > 90) {
      organStatus.heart = 'borderline';
      organStatus.vessels = 'borderline';
    } else {
      organStatus.heart = 'normal';
      organStatus.vessels = 'normal';
    }
    
    // 간: ALT 기반
    if (healthRecord.alt > 40) {
      organStatus.liver = 'risk';
    } else if (healthRecord.alt > 35) {
      organStatus.liver = 'borderline';
    } else {
      organStatus.liver = 'normal';
    }
    
    // 췌장/혈당: 공복혈당 기반
    const glucose = healthRecord.fasting_glucose || healthRecord.glucose;
    if (glucose > 126) {
      organStatus.pancreas = 'risk';
    } else if (glucose > 100) {
      organStatus.pancreas = 'borderline';
    } else {
      organStatus.pancreas = 'normal';
    }
    
    // 복부/지방: 허리둘레 기반
    if (healthRecord.waist > 90) {
      organStatus.abdomen = 'risk';
    } else if (healthRecord.waist > 85) {
      organStatus.abdomen = 'borderline';
    } else {
      organStatus.abdomen = 'normal';
    }
    
    return organStatus;
  };

  /**
   * 장기별 상세 정보 반환
   */
  const getOrganInfo = (organId) => {
    const organInfoMap = {
      heart: {
        title: '심장 및 혈관 건강',
        metrics: [
          { label: '수축기 혈압', value: healthRecord.blood_pressure_s, unit: 'mmHg', normal: '120 이하' },
          { label: '이완기 혈압', value: healthRecord.blood_pressure_d, unit: 'mmHg', normal: '80 이하' }
        ],
        recommendation: healthRecord.blood_pressure_s > 140 ? '혈압 관리를 위해 정기적인 운동과 저염식을 권고합니다.' : '현재 정상 범위입니다.'
      },
      liver: {
        title: '간 기능 지표',
        metrics: [
          { label: 'ALT (알라닌 전이효소)', value: healthRecord.alt, unit: 'U/L', normal: '40 이하' },
          { label: 'AST (아스파르테이트 전이효소)', value: healthRecord.ast, unit: 'U/L', normal: '40 이하' },
          { label: 'Gamma-GTP', value: healthRecord.gamma_gtp, unit: 'U/L', normal: '50 이하' }
        ],
        recommendation: healthRecord.alt > 40 ? '음주를 줄이고 정기 검진을 권고합니다.' : '간 기능이 정상입니다.'
      },
      pancreas: {
        title: '췌장 및 혈당 관리',
        metrics: [
          { label: '공복 혈당', value: healthRecord.fasting_glucose || healthRecord.glucose, unit: 'mg/dL', normal: '100 이하' }
        ],
        recommendation: (healthRecord.fasting_glucose || healthRecord.glucose) > 100 ? '혈당 관리를 위해 규칙적인 운동과 식단 조절을 권고합니다.' : '혈당 수치가 정상입니다.'
      },
      vessels: {
        title: '혈관 및 순환계 건강',
        metrics: [
          { label: '중성 지방 (TG)', value: healthRecord.tg, unit: 'mg/dL', normal: '150 이하' },
          { label: 'HDL 콜레스테롤', value: healthRecord.hdl, unit: 'mg/dL', normal: '40 이상' },
          { label: 'LDL 콜레스테롤', value: healthRecord.ldl, unit: 'mg/dL', normal: '130 이하' }
        ],
        recommendation: healthRecord.tg > 150 ? '지방 섭취를 줄이고 유산소 운동을 권고합니다.' : '혈관 건강이 양호합니다.'
      },
      abdomen: {
        title: '복부 비만 및 대사증후군',
        metrics: [
          { label: '허리둘레', value: healthRecord.waist, unit: 'cm', normal: '90 이하' },
          { label: 'BMI', value: healthRecord.bmi, unit: 'kg/m²', normal: '25 이하' }
        ],
        recommendation: healthRecord.waist > 90 ? '복부 비만 관리를 위해 규칙적인 운동과 식단 조절을 권고합니다.' : '복부 비만이 없습니다.'
      }
    };
    return organInfoMap[organId];
  };

  const organStatus = calculateOrganStatus();

  /**
   * 팝업 위치 결정 함수
   * 클릭한 장기의 위치에 따라 팝업이 좌측 또는 우측에 표시되도록 함
   */
  const getPopupPosition = (organId) => {
    // liver는 우측에 위치하므로 팝업은 좌측에
    if (organId === 'liver') return 'left';
    // 나머지는 중앙 또는 좌측이므로 팝업은 우측에
    return 'right';
  };

  const popupSide = selectedOrgan ? getPopupPosition(selectedOrgan) : 'right';

  return (
    <div className="min-h-screen bg-[#f9f7f0] pb-20">
      <header className="bg-white border-b border-orange-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/mypage" className="flex items-center gap-2 text-slate-600 font-bold hover:text-teal-600 transition-all">
            <ChevronLeft className="w-6 h-6" /> 뒤로가기
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-teal-600 fill-current" />
            <h1 className="text-xl font-black text-slate-900">정밀 건강 리포트</h1>
          </div>
          <button className="p-2 text-slate-400 hover:text-teal-600 transition-all">
            <Download className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 pb-20">
        {/* 신체 부위별 정밀 분석 섹션 */}
        <div className="mb-12">
          <h2 className="text-2xl font-black text-slate-900 mb-2">신체 부위별 정밀 분석</h2>
          <p className="text-slate-500 font-medium mb-8">최신 검진 데이터를 기반으로 한 신체 기관별 분석입니다.</p>
        </div>

        {/* 2열 레이아웃: 인체 SVG (좌) + 위험요소 대시보드 (우) */}
        <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-8 mb-12">
          {/* 좌측: 인체 SVG 모델 */}
          <div className="flex flex-col">
            <HumanBodySVG 
              organStatus={organStatus}
              activeOrgan={activeOrgan}
              onOrganHover={(organ) => {
                setActiveOrgan(organ);
                if (organ) {
                  const info = getOrganInfo(organ);
                  setPopupData({ organId: organ, ...info });
                } else {
                  setPopupData(null);
                }
              }}
              selectedOrgan={selectedOrgan}
              onOrganSelect={(organ) => setSelectedOrgan(organ)}
            />
            <p className="text-xs text-slate-500 font-medium text-center mt-4">
              각 부위를 마우스로 올려 상세 정보를 확인하세요
            </p>
          </div>

          {/* 우측: 위험요소 분석 + AI 권고 */}
          <div className="space-y-6">
            {/* 주요 위험요소 분석 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-50">
              <h3 className="text-lg font-bold text-slate-900 mb-6">주요 위험요소 분석</h3>
              
              <div className="space-y-5">
                {/* 복부 비만 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-600">복부 비만 (Abdominal)</span>
                    <span className={`text-xs font-black px-3 py-1 rounded-full ${healthRecord.waist > 90 ? 'bg-red-50 text-red-600' : healthRecord.waist > 85 ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'}`}>
                      {healthRecord.waist > 90 ? 'Risk' : healthRecord.waist > 85 ? 'Borderline' : 'Stable'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className={`h-full rounded-full transition-all ${healthRecord.waist > 90 ? 'bg-red-500' : healthRecord.waist > 85 ? 'bg-amber-500' : 'bg-teal-500'}`}
                      style={{ width: `${Math.min((healthRecord.waist / 110) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-400">{healthRecord.waist}cm</span>
                    <span className="text-xs text-slate-400">정상: 85cm 이하</span>
                  </div>
                </div>

                {/* 간 기능 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-600">간 기능 (Liver Function)</span>
                    <span className={`text-xs font-black px-3 py-1 rounded-full ${healthRecord.alt > 40 ? 'bg-red-50 text-red-600' : healthRecord.alt > 35 ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'}`}>
                      {healthRecord.alt > 40 ? 'Risk' : healthRecord.alt > 35 ? 'Borderline' : 'Stable'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className={`h-full rounded-full transition-all ${healthRecord.alt > 40 ? 'bg-orange-500' : healthRecord.alt > 35 ? 'bg-amber-500' : 'bg-teal-500'}`}
                      style={{ width: `${Math.min((healthRecord.alt / 60) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-400">ALT: {healthRecord.alt}U/L</span>
                    <span className="text-xs text-slate-400">정상: 40U/L 이하</span>
                  </div>
                </div>

                {/* 혈당 수치 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-600">혈당 수치 (Glucose Levels)</span>
                    <span className={`text-xs font-black px-3 py-1 rounded-full ${(healthRecord.glucose || healthRecord.fasting_glucose) > 126 ? 'bg-red-50 text-red-600' : (healthRecord.glucose || healthRecord.fasting_glucose) > 100 ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'}`}>
                      {(healthRecord.glucose || healthRecord.fasting_glucose) > 126 ? 'Risk' : (healthRecord.glucose || healthRecord.fasting_glucose) > 100 ? 'Borderline' : 'Stable'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className={`h-full rounded-full transition-all ${(healthRecord.glucose || healthRecord.fasting_glucose) > 126 ? 'bg-green-500' : (healthRecord.glucose || healthRecord.fasting_glucose) > 100 ? 'bg-amber-500' : 'bg-teal-500'}`}
                      style={{ width: `${Math.min(((healthRecord.glucose || healthRecord.fasting_glucose) / 150) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-400">{healthRecord.glucose || healthRecord.fasting_glucose}mg/dL</span>
                    <span className="text-xs text-slate-400">정상: 100mg/dL 이하</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI 맞춤 건강 제언 */}
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-blue-900 mb-1 text-sm">AI 맞춤 건강 제언</h4>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    {aiReport?.medical_recommendation || "정기적인 운동과 균형 잡힌 식단을 유지하세요."}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-900 mb-1 text-sm">운동 가이드</h4>
                    <p className="text-blue-800 text-sm">주 3-4회, 하루 30분 이상의 유산소 운동을 권장합니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 호버 시 팝업 패널 - 좌우 동적 배치 */}
        {popupData && (
          <div className="fixed bottom-0 right-0 left-0 top-0 bg-black/30 z-40 flex items-end lg:items-center gap-0" onClick={() => setPopupData(null)}>
            {/* 좌측 팝업 (liver 클릭 시) */}
            {popupSide === 'left' && (
              <div className="bg-white w-full lg:w-96 h-full lg:h-auto p-6 rounded-t-3xl lg:rounded-3xl shadow-2xl border border-teal-100 lg:ml-6 flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-teal-600 fill-current" />
                    {popupData.title}
                  </h4>
                  <button 
                    onClick={() => setPopupData(null)}
                    className="p-1 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto flex-1">
                  {popupData.metrics?.map((metric, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 mb-1">{metric.label}</p>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-lg font-black text-slate-900">{metric.value || '-'}</span>
                        <span className="text-xs text-slate-400">{metric.unit}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">정상범위: {metric.normal}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex-shrink-0">
                  <p className="text-sm font-bold text-amber-800 mb-2">💡 권고사항</p>
                  <p className="text-sm text-amber-700 leading-relaxed">{popupData.recommendation}</p>
                </div>
              </div>
            )}

            {/* 우측 팝업 (heart, pancreas, abdomen, vessels 클릭 시) */}
            {popupSide === 'right' && (
              <div className="bg-white w-full lg:w-96 h-full lg:h-auto p-6 rounded-t-3xl lg:rounded-3xl shadow-2xl border border-teal-100 lg:mr-6 flex flex-col ml-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-teal-600 fill-current" />
                    {popupData.title}
                  </h4>
                  <button 
                    onClick={() => setPopupData(null)}
                    className="p-1 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto flex-1">
                  {popupData.metrics?.map((metric, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 mb-1">{metric.label}</p>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-lg font-black text-slate-900">{metric.value || '-'}</span>
                        <span className="text-xs text-slate-400">{metric.unit}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">정상범위: {metric.normal}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex-shrink-0">
                  <p className="text-sm font-bold text-amber-800 mb-2">💡 권고사항</p>
                  <p className="text-sm text-amber-700 leading-relaxed">{popupData.recommendation}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 하단 메트릭 카드 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-orange-50 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-3">
              <CheckCircle2 className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">Health Score</p>
            <p className="text-4xl font-black text-slate-900">{healthRecord.health_score}</p>
            <p className="text-slate-500 text-xs mt-2 font-medium">/100</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-orange-50 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mb-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">Analysis Precision</p>
            <p className="text-4xl font-black text-slate-900">{aiReport?.analysis_precision || 99.2}</p>
            <p className="text-slate-500 text-xs mt-2 font-medium">%</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-orange-50 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 mb-3">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">Warning Items</p>
            <p className="text-4xl font-black text-slate-900">{aiReport?.warning_items_count || 0}</p>
            <p className="text-slate-500 text-xs mt-2 font-medium">Found</p>
          </div>
        </section>
      </main>
    </div>
  );
}
