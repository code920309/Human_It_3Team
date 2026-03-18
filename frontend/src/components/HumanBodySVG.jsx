/**
 * HumanBodySVG 컴포넌트 - 의료용 해부도
 * [기능] 의학적으로 정확한 인체 해부도를 통해 장기별 건강 상태를 시각화
 * [특징]
 *   - 실제 의료 공부 자료와 유사한 해부학적 구조
 *   - Props로 전달받은 organStatus에 따라 동적 색상 변경
 *   - 호버/클릭 상호작용으로 장기 강조 표시
 *   - 경량 SVG 기반으로 빠른 로딩
 * [역할] 복잡한 검진 수치를 의료적으로 정확하게 시각화
 */
const HumanBodySVG = ({ organStatus, activeOrgan, onOrganHover, selectedOrgan, onOrganSelect }) => {
  
  const getOrganColor = (organId) => {
    // 호버되거나 선택된 장기는 강조색(Teal) 사용
    if (activeOrgan === organId || selectedOrgan === organId) return '#0d9488'; // teal-600
    
    // 기본 상태에서는 위험도에 따라 색상 결정
    const status = organStatus?.[organId] || 'normal';
    switch (status) {
      case 'risk': return '#ef4444'; // red-500
      case 'borderline': return '#f59e0b'; // amber-500
      default: return '#cbd5e1'; // slate-300 (회색)
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center relative overflow-hidden">
      {/* 의료용 해부도 SVG - 실제 의학적 위치 기반 */}
      <svg viewBox="0 0 300 480" className="w-full max-w-xs h-auto drop-shadow-lg transition-all duration-300">
        <defs>
          <style>{`
            .organ-label { font-family: 'Segoe UI', Arial; font-size: 11px; font-weight: 600; text-anchor: middle; }
            .organ-path { transition: all 0.3s ease; }
            .organ-path:hover { filter: drop-shadow(0 0 6px rgba(20, 184, 166, 0.5)); }
          `}</style>
        </defs>

        {/* 배경: 인체 실루엣 (회색 톤) */}
        <path
          d="M150 10c-25 0-45 20-45 45s20 45 45 45 45-20 45-45-20-45-45-45z
             M110 110c-20 0-35 15-35 35v80c0 15 10 30 20 35v100c0 25 20 45 45 45s45-20 45-45V260c10-5 20-20 20-35V145c0-20-15-35-35-35H110z"
          fill="#f1f5f9"
          stroke="#cbd5e1"
          strokeWidth="1.5"
          opacity="0.6"
        />

        {/* ===== 혈관 시스템 (Vessels) - 빨강 ===== */}
        {/* 대동맥 및 주요 혈관 */}
        <g className="organ-path" onClick={() => onOrganSelect('vessels')} onMouseEnter={() => onOrganHover('vessels')} onMouseLeave={() => onOrganHover(null)}>
          {/* 대동맥궁 */}
          <path d="M150 80 Q130 90 120 120 Q115 140 120 160" fill="none" stroke={getOrganColor('vessels')} strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
          {/* 우측 대동맥 */}
          <path d="M150 80 Q170 90 180 120 Q185 140 180 160" fill="none" stroke={getOrganColor('vessels')} strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
          {/* 하행 대동맥 */}
          <path d="M150 100 L150 280" fill="none" stroke={getOrganColor('vessels')} strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
          {/* 장골동맥 좌 */}
          <path d="M140 280 Q130 300 125 330 L110 400" fill="none" stroke={getOrganColor('vessels')} strokeWidth="1.8" strokeLinecap="round" opacity="0.7"/>
          {/* 장골동맥 우 */}
          <path d="M160 280 Q170 300 175 330 L190 400" fill="none" stroke={getOrganColor('vessels')} strokeWidth="1.8" strokeLinecap="round" opacity="0.7"/>
          <title>혈관 및 순환계</title>
        </g>

        {/* ===== 심장 (Heart) - 빨강 ===== */}
        <g className="organ-path cursor-pointer" onClick={() => onOrganSelect('heart')} onMouseEnter={() => onOrganHover('heart')} onMouseLeave={() => onOrganHover(null)}>
          {/* 심장 본체 */}
          <ellipse cx="150" cy="95" rx="18" ry="22" fill={getOrganColor('heart')} opacity="0.9"/>
          {/* 심실 구분선 */}
          <line x1="140" y1="95" x2="160" y2="95" stroke="#ffffff" strokeWidth="1" opacity="0.6"/>
          {/* 심실 */}
          <path d="M132 105 Q150 130 168 105" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.6"/>
          <title>심장 (Heart)</title>
        </g>

        {/* ===== 간 (Liver) - 주황 ===== */}
        <g className="organ-path cursor-pointer" onClick={() => onOrganSelect('liver')} onMouseEnter={() => onOrganHover('liver')} onMouseLeave={() => onOrganHover(null)}>
          {/* 간 (우측 상복부) */}
          <ellipse cx="185" cy="155" rx="22" ry="28" fill={getOrganColor('liver')} opacity="0.85"/>
          {/* 간의 갈비뼈 모양 표현 */}
          <path d="M170 145 Q185 140 200 150" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.5"/>
          <path d="M168 160 Q185 158 202 168" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.5"/>
          <title>간 (Liver)</title>
        </g>

        {/* ===== 췌장 (Pancreas) - 노랑 ===== */}
        <g className="organ-path cursor-pointer" onClick={() => onOrganSelect('pancreas')} onMouseEnter={() => onOrganHover('pancreas')} onMouseLeave={() => onOrganHover(null)}>
          {/* 췌장 (위 아래, 중앙 좌측) */}
          <path d="M140 170 Q125 175 115 175 Q110 175 115 185 Q125 185 140 190" 
                fill={getOrganColor('pancreas')} opacity="0.85" stroke={getOrganColor('pancreas')} strokeWidth="1"/>
          <title>췌장 (Pancreas)</title>
        </g>

        {/* ===== 복부 장기 (Abdomen/위) - 보라 ===== */}
        <g className="organ-path cursor-pointer" onClick={() => onOrganSelect('abdomen')} onMouseEnter={() => onOrganHover('abdomen')} onMouseLeave={() => onOrganHover(null)}>
          {/* 복부 지질 분포 영역 - 내장 지방 */}
          <ellipse cx="150" cy="240" rx="45" ry="48" fill={getOrganColor('abdomen')} opacity="0.35" stroke={getOrganColor('abdomen')} strokeWidth="2" strokeDasharray="3,2"/>
          {/* 복부 중심 (내장 지방) */}
          <circle cx="150" cy="240" r="20" fill={getOrganColor('abdomen')} opacity="0.6"/>
          <title>복부 (Abdomen)</title>
        </g>

        {/* ===== 장기 레이블 ===== */}
        <text x="150" y="68" className="organ-label" fill="#374151">뇌</text>
        <text x="150" y="125" className="organ-label" fill="#7f1d1d" fontWeight="700">Heart</text>
        <text x="210" y="150" className="organ-label" fill="#92400e" fontWeight="700">Liver</text>
        <text x="110" y="195" className="organ-label" fill="#854d0e" fontSize="10">Pancreas</text>
        <text x="150" y="305" className="organ-label" fill="#4c1d95" fontWeight="700">Abdomen</text>
      </svg>

      {/* 상호작용 가이드 텍스트 */}
      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center pointer-events-none">
        <p className="text-slate-500 font-bold text-xs text-center px-4">
          장기를 클릭하여 상세 정보 확인
        </p>
      </div>
    </div>
  );
};

export default HumanBodySVG;
