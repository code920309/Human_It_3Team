import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Heart, ChevronLeft, Download, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
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
   * 건강 데이터를 기반으로 장기별 상태를 계산
   * heart: 혈압 기반, liver: ALT 기반, pancreas: 공복혈당 기반, vessels: 혈압/혈당 기반, abdomen: 허리둘레 기반
   */
  const calculateOrganStatus = () => {
    // 초과 수치 수: 0개=정상, 1개=주의, 2개 이상=위험
    const toStatus = (count) => count === 0 ? 'normal' : count === 1 ? 'borderline' : 'risk';

    // 심장: 수축기 혈압, 이완기 혈압
    const heartExceeded = [
      healthRecord.blood_pressure_s > 120,
      healthRecord.blood_pressure_d > 80,
    ].filter(Boolean).length;

    // 간: ALT, AST, Gamma-GTP
    const liverExceeded = [
      healthRecord.alt > 40,
      healthRecord.ast > 40,
      (healthRecord.gamma_gtp || 0) > 50,
    ].filter(Boolean).length;

    // 췌장: 공복혈당 (100 초과 / 126 초과를 각각 1카운트로 산정)
    const glucose = healthRecord.fasting_glucose || healthRecord.glucose;
    const pancreasExceeded = [glucose > 100, glucose > 126].filter(Boolean).length;

    // 복부: 허리둘레, BMI
    const abdomenExceeded = [
      healthRecord.waist > 90,
      healthRecord.bmi > 25,
    ].filter(Boolean).length;

    // 혈관: 중성지방, HDL(역방향), LDL
    const vesselsExceeded = [
      (healthRecord.tg || 0) > 150,
      (healthRecord.hdl || 999) < 40,
      (healthRecord.ldl || 0) > 130,
    ].filter(Boolean).length;

    return {
      heart:    toStatus(heartExceeded),
      liver:    toStatus(liverExceeded),
      pancreas: toStatus(pancreasExceeded),
      abdomen:  toStatus(abdomenExceeded),
      vessels:  toStatus(vesselsExceeded),
    };
  };

  /**
   * 장기별 상세 정보 반환
   */
  const getOrganInfo = (organId) => {
    const organInfoMap = {
      heart: {
        title: '심장 및 혈관 건강',
        metrics: [
          { label: '수축기 혈압', value: healthRecord.blood_pressure_s, unit: 'mmHg', normal: '120 이하', threshold: 120, higherIsBetter: false },
          { label: '이완기 혈압', value: healthRecord.blood_pressure_d, unit: 'mmHg', normal: '80 이하', threshold: 80, higherIsBetter: false }
        ],
        recommendation: healthRecord.blood_pressure_s > 140 ? '혈압 관리를 위해 정기적인 운동과 저염식을 권고합니다.' : '현재 정상 범위입니다.'
      },
      liver: {
        title: '간 기능 지표',
        metrics: [
          { label: 'ALT (알라닌 전이효소)', value: healthRecord.alt, unit: 'U/L', normal: '40 이하', threshold: 40, higherIsBetter: false },
          { label: 'AST (아스파르테이트 전이효소)', value: healthRecord.ast, unit: 'U/L', normal: '40 이하', threshold: 40, higherIsBetter: false },
          { label: 'Gamma-GTP', value: healthRecord.gamma_gtp, unit: 'U/L', normal: '50 이하', threshold: 50, higherIsBetter: false }
        ],
        recommendation: healthRecord.alt > 40 ? '음주를 줄이고 정기 검진을 권고합니다.' : '간 기능이 정상입니다.'
      },
      pancreas: {
        title: '췌장 및 혈당 관리',
        metrics: [
          { label: '공복 혈당', value: healthRecord.fasting_glucose || healthRecord.glucose, unit: 'mg/dL', normal: '100 이하', threshold: 100, higherIsBetter: false }
        ],
        recommendation: (healthRecord.fasting_glucose || healthRecord.glucose) > 100 ? '혈당 관리를 위해 규칙적인 운동과 식단 조절을 권고합니다.' : '혈당 수치가 정상입니다.'
      },
      vessels: {
        title: '혈관 및 순환계 건강',
        metrics: [
          { label: '중성 지방 (TG)', value: healthRecord.tg, unit: 'mg/dL', normal: '150 이하', threshold: 150, higherIsBetter: false },
          { label: 'HDL 콜레스테롤', value: healthRecord.hdl, unit: 'mg/dL', normal: '40 이상', threshold: 40, higherIsBetter: true },
          { label: 'LDL 콜레스테롤', value: healthRecord.ldl, unit: 'mg/dL', normal: '130 이하', threshold: 130, higherIsBetter: false }
        ],
        recommendation: healthRecord.tg > 150 ? '지방 섭취를 줄이고 유산소 운동을 권고합니다.' : '혈관 건강이 양호합니다.'
      },
      abdomen: {
        title: '복부 비만 및 대사증후군',
        metrics: [
          { label: '허리둘레', value: healthRecord.waist, unit: 'cm', normal: '90 이하', threshold: 90, higherIsBetter: false },
          { label: 'BMI', value: healthRecord.bmi, unit: 'kg/m²', normal: '25 이하', threshold: 25, higherIsBetter: false }
        ],
        recommendation: healthRecord.waist > 90 ? '복부 비만 관리를 위해 규칙적인 운동과 식단 조절을 권고합니다.' : '복부 비만이 없습니다.'
      }
    };
    return organInfoMap[organId];
  };

  const organStatus = calculateOrganStatus();

  // 장기 레이아웃 정의 (viewBox 0 0 300 340 기준 위치)
  // cardPos: SVG 컨테이너 내 반투명 카드 위치 (장기 근처 오버레이)
  const organLayout = [
    { id: 'heart',    kr: '심장', en: 'Heart',    cardPos: { top: '37%', left:  '2%' }, desc: '수축기/이완기 혈압 연동' },
    { id: 'pancreas', kr: '췌장', en: 'Pancreas', cardPos: { top: '48%', left:  '2%' }, desc: '공복혈당, HbA1c 기반 산출' },
    { id: 'liver',    kr: '간',   en: 'Liver',    cardPos: { top: '58%', right: '2%' }, desc: 'AST, ALT, Gamma-GTP 분석' },
    { id: 'abdomen',  kr: '복부', en: 'Abdomen',  cardPos: { top: '71%', left:  '2%' }, desc: '허리둘레, 중성지방, BMI 수치 연동' },
    { id: 'vessels',  kr: '혈관', en: 'Vessels',  cardPos: { top: '42%', right: '2%' }, desc: 'HDL/LDL 콜레스테롤 분석' },
  ];

  // 카드-장기 연결선 좌표 (viewBox 0 0 300 340 기준)
  // x1,y1: 카드 안쪽 엣지 근처 / x2,y2: 장기 중심
  const connections = {
    heart:    { x1: 88,  y1: 146, x2: 116, y2: 162 },
    pancreas: { x1: 88,  y1: 183, x2: 137, y2: 182 },
    liver:    { x1: 212, y1: 217, x2: 190, y2: 209 },
    abdomen:  { x1: 88,  y1: 261, x2: 150, y2: 255 },
    vessels:  { x1: 212, y1: 163, x2: 174, y2: 152 },
  };

  const statusConfig = {
    normal:     { label: '정상', textClass: 'text-teal-600',  bgClass: 'bg-teal-50',  borderClass: 'border-teal-200' },
    borderline: { label: '주의', textClass: 'text-amber-600', bgClass: 'bg-amber-50', borderClass: 'border-amber-200' },
    risk:       { label: '위험', textClass: 'text-red-600',   bgClass: 'bg-red-50',   borderClass: 'border-red-200' },
  };

  const getPopupPosition = (organId) => {
    if (organId === 'liver') return 'left';
    return 'right';
  };

  const popupSide = selectedOrgan ? getPopupPosition(selectedOrgan) : 'right';

  const handleOrganClick = (organId) => {
    setSelectedOrgan(organId);
    if (organId) {
      const info = getOrganInfo(organId);
      setPopupData({ organId, ...info });
    } else {
      setPopupData(null);
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
            <h1 className="text-xl font-black text-slate-900">정밀 건강 리포트</h1>
          </div>
          <button className="p-2 text-slate-400 hover:text-teal-600 transition-all">
            <Download className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 pb-20">
        {/* 페이지 타이틀 */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-900 mb-2">신체 부위별 정밀 분석</h2>
          <p className="text-slate-500 font-medium">최신 검진 데이터를 기반으로 한 신체 기관별 건강 상태 리포트입니다.</p>
        </div>

        {/* 2열: 장기 매핑(좌) + 위험요소·AI(우) */}
        <div className="grid grid-cols-1 lg:grid-cols-[58%_42%] gap-6 mb-8">

          {/* 좌: 장기 매핑 카드 */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <div className="relative">

              {/* 범례 - 우측 상단 세로 */}
              <div className="absolute top-0 right-0 flex flex-col gap-2 z-20 bg-white/90 backdrop-blur-sm px-2 py-2 rounded-lg border border-slate-100 shadow-sm">
                {[['#ef4444', '위험'], ['#f59e0b', '주의'], ['#14b8a6', '정상']].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c }}/>
                    <span className="text-xs text-slate-500 font-medium">{l}</span>
                  </div>
                ))}
              </div>

              {/* SVG 전체 너비 */}
              <HumanBodySVG
                organStatus={organStatus}
                activeOrgan={activeOrgan}
                onOrganHover={(organ) => setActiveOrgan(organ)}
                selectedOrgan={selectedOrgan}
                onOrganSelect={handleOrganClick}
              />

              {/* 카드-장기 연결 점선 오버레이 SVG */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 5 }}
                viewBox="0 0 300 340"
                preserveAspectRatio="xMidYMid meet"
              >
                {organLayout.map(organ => {
                  const conn = connections[organ.id];
                  const isSelected = selectedOrgan === organ.id;
                  const isActive = activeOrgan === organ.id;
                  const status = organStatus[organ.id];
                  const color = isSelected
                    ? (status === 'risk' ? '#ef4444' : status === 'borderline' ? '#f59e0b' : '#14b8a6')
                    : isActive ? '#64748b' : '#cbd5e1';
                  return (
                    <line
                      key={organ.id}
                      x1={conn.x1} y1={conn.y1}
                      x2={conn.x2} y2={conn.y2}
                      stroke={color}
                      strokeWidth="2"
                      strokeDasharray="6,4"
                      opacity="0.85"
                    />
                  );
                })}
              </svg>

              {/* 장기 카드 오버레이 - 각 장기 근처에 반투명 배치 */}
              {organLayout.map(organ => {
                const s = statusConfig[organStatus[organ.id]] || statusConfig.normal;
                const isSelected = selectedOrgan === organ.id;
                return (
                  <div key={organ.id} className="absolute z-10" style={organ.cardPos}>
                    <button
                      className={`text-left px-2 py-1.5 rounded-lg border transition-all backdrop-blur-sm hover:shadow-md ${
                        isSelected
                          ? `${s.bgClass} ${s.borderClass} shadow-md`
                          : 'bg-white/70 border-white/60 hover:bg-white/90'
                      }`}
                      style={{ maxWidth: '145px' }}
                      onClick={() => handleOrganClick(organ.id)}
                    >
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-bold text-slate-700 text-xs">{organ.kr} ({organ.en})</span>
                        <span className={`text-xs font-bold ${s.textClass}`}>: {s.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{organ.desc}</p>
                    </button>
                  </div>
                );
              })}

            </div>
          </div>

          {/* 우: 위험요소 분석 + AI 제언 (세로 스택) */}
          <div className="flex flex-col gap-4">
            {/* 주요 위험요소 분석 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-50">
              <h3 className="text-lg font-bold text-slate-900 mb-5">주요 위험요소 분석</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-600">복부 비만 (Abdominal)</span>
                    <span className={`text-xs font-black px-3 py-1 rounded-full ${healthRecord.waist > 90 ? 'bg-red-50 text-red-600' : healthRecord.waist > 85 ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'}`}>
                      {healthRecord.waist > 90 ? 'Risk' : healthRecord.waist > 85 ? 'Borderline' : 'Stable'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-full rounded-full transition-all ${healthRecord.waist > 90 ? 'bg-red-500' : healthRecord.waist > 85 ? 'bg-amber-500' : 'bg-teal-500'}`} style={{ width: `${Math.min((healthRecord.waist / 110) * 100, 100)}%` }}/>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-400">{healthRecord.waist}cm</span>
                    <span className="text-xs text-slate-400">정상: 85cm 이하</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-600">간 기능 (Liver Function)</span>
                    <span className={`text-xs font-black px-3 py-1 rounded-full ${healthRecord.alt > 40 ? 'bg-red-50 text-red-600' : healthRecord.alt > 35 ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'}`}>
                      {healthRecord.alt > 40 ? 'Risk' : healthRecord.alt > 35 ? 'Borderline' : 'Stable'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-full rounded-full transition-all ${healthRecord.alt > 40 ? 'bg-orange-500' : healthRecord.alt > 35 ? 'bg-amber-500' : 'bg-teal-500'}`} style={{ width: `${Math.min((healthRecord.alt / 60) * 100, 100)}%` }}/>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-400">ALT: {healthRecord.alt}U/L</span>
                    <span className="text-xs text-slate-400">정상: 40U/L 이하</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-600">혈당 수치 (Glucose)</span>
                    <span className={`text-xs font-black px-3 py-1 rounded-full ${(healthRecord.glucose || healthRecord.fasting_glucose) > 126 ? 'bg-red-50 text-red-600' : (healthRecord.glucose || healthRecord.fasting_glucose) > 100 ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'}`}>
                      {(healthRecord.glucose || healthRecord.fasting_glucose) > 126 ? 'Risk' : (healthRecord.glucose || healthRecord.fasting_glucose) > 100 ? 'Borderline' : 'Stable'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-full rounded-full transition-all ${(healthRecord.glucose || healthRecord.fasting_glucose) > 126 ? 'bg-green-500' : (healthRecord.glucose || healthRecord.fasting_glucose) > 100 ? 'bg-amber-500' : 'bg-teal-500'}`} style={{ width: `${Math.min(((healthRecord.glucose || healthRecord.fasting_glucose) / 150) * 100, 100)}%` }}/>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-400">{healthRecord.glucose || healthRecord.fasting_glucose}mg/dL</span>
                    <span className="text-xs text-slate-400">정상: 100mg/dL 이하</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI 맞춤 건강 제언 */}
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h4 className="font-bold text-blue-900 text-base">AI 맞춤 건강 제언</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-blue-900 text-sm mb-0.5">식이요법</p>
                    <p className="text-blue-800 text-xs leading-relaxed">
                      {aiReport?.medical_recommendation || "정기적인 운동과 균형 잡힌 식단을 유지하세요."}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-blue-900 text-sm mb-0.5">운동 가이드</p>
                    <p className="text-blue-800 text-xs">주 3-4회, 하루 30분 이상의 유산소 운동을 권장합니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 호버 시 팝업 패널 - 좌우 동적 배치 */}
        {popupData && (
          <div className="fixed bottom-0 right-0 left-0 top-0 bg-black/30 z-40 flex items-end lg:items-center gap-0" onClick={() => { setPopupData(null); setSelectedOrgan(null); }}>
            {/* 좌측 팝업 (liver 클릭 시) */}
            {popupSide === 'left' && (
              <div className="bg-white w-full lg:w-96 h-full lg:h-auto p-6 rounded-t-3xl lg:rounded-3xl shadow-2xl border border-teal-100 lg:ml-6 flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-teal-600 fill-current" />
                    {popupData.title}
                  </h4>
                  <button 
                    onClick={() => { setPopupData(null); setSelectedOrgan(null); }}
                    className="p-1 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto flex-1">
                  {popupData.metrics?.map((metric, idx) => {
                    const isExceeded = metric.threshold != null && metric.value != null && (
                      metric.higherIsBetter ? metric.value < metric.threshold : metric.value > metric.threshold
                    );
                    const diff = metric.threshold != null && metric.value != null
                      ? Math.abs(metric.value - metric.threshold).toFixed(1)
                      : null;
                    return (
                      <div key={idx} className={`p-3 rounded-lg border ${isExceeded ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                        <p className="text-xs font-bold text-slate-500 mb-1">{metric.label}</p>
                        <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                          <span className={`text-lg font-black ${isExceeded ? 'text-red-600' : 'text-slate-900'}`}>{metric.value ?? '-'}</span>
                          <span className="text-xs text-slate-400">{metric.unit}</span>
                          {isExceeded && diff && (
                            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                              {metric.higherIsBetter ? `${diff} ${metric.unit} 부족` : `+${diff} ${metric.unit} 초과`}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">정상범위: {metric.normal}</span>
                        </div>
                      </div>
                    );
                  })}
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
                    onClick={() => { setPopupData(null); setSelectedOrgan(null); }}
                    className="p-1 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto flex-1">
                  {popupData.metrics?.map((metric, idx) => {
                    const isExceeded = metric.threshold != null && metric.value != null && (
                      metric.higherIsBetter ? metric.value < metric.threshold : metric.value > metric.threshold
                    );
                    const diff = metric.threshold != null && metric.value != null
                      ? Math.abs(metric.value - metric.threshold).toFixed(1)
                      : null;
                    return (
                      <div key={idx} className={`p-3 rounded-lg border ${isExceeded ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                        <p className="text-xs font-bold text-slate-500 mb-1">{metric.label}</p>
                        <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                          <span className={`text-lg font-black ${isExceeded ? 'text-red-600' : 'text-slate-900'}`}>{metric.value ?? '-'}</span>
                          <span className="text-xs text-slate-400">{metric.unit}</span>
                          {isExceeded && diff && (
                            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                              {metric.higherIsBetter ? `${diff} ${metric.unit} 부족` : `+${diff} ${metric.unit} 초과`}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">정상범위: {metric.normal}</span>
                        </div>
                      </div>
                    );
                  })}
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
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-8 rounded-3xl border border-orange-50 text-center shadow-sm flex items-center gap-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Health Score</p>
              <p className="text-3xl font-black text-slate-900">{healthRecord.health_score}<span className="text-slate-400 text-base font-medium">/100</span></p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-orange-50 text-center shadow-sm flex items-center gap-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-left">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Analysis Precision</p>
              <p className="text-3xl font-black text-slate-900">{aiReport?.analysis_precision || 99.2}<span className="text-slate-400 text-base font-medium">%</span></p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-orange-50 text-center shadow-sm flex items-center gap-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Warning Items</p>
              <p className="text-3xl font-black text-slate-900">{aiReport?.warning_items_count || 0}<span className="text-slate-400 text-base font-medium ml-1">Found</span></p>
            </div>
          </div>
        </section>

        {/* PDF 다운로드 버튼 */}
        <div className="flex justify-center mt-4 mb-4">
          <button className="bg-teal-600 text-white px-12 py-4 rounded-2xl font-bold text-base hover:bg-teal-700 transition-colors shadow-md flex items-center gap-2">
            <Download className="w-5 h-5" />
            전체 상세 리포트 다운로드 (PDF)
          </button>
        </div>
      </main>
    </div>
  );
}
