/**
 * HumanBodySVG 컴포넌트
 * [기능] 인체 장기별 건강 상태를 SVG로 시각화하고 상호작용 제공
 * [구현] 
 *   - Props로 전달받은 organStatus에 따라 장기별 색상 동적 변경
 *   - 마우스 호버(activeOrgan) 및 클릭(selectedOrgan) 상태에 따른 강조 효과
 *   - Tailwind CSS와 인라인 SVG 스타일을 결합한 반응형 디자인
 * [역할] 복잡한 검진 수치를 사용자가 한눈에 이해할 수 있도록 직관적인 '인체 지도' 역할 수행
 */
const HumanBodySVG = ({ organStatus, activeOrgan, onOrganHover, selectedOrgan, onOrganSelect }) => {
  
  /**
   * getOrganColor 함수
   * @param {string} organId - 장기 식별자 (heart, liver, pancreas 등)
   * @returns {string} Hex 색상 코드
   * 각 장기의 현재 상태(위험/주의/정상) 및 사용자 상호작용 상태를 판단하여 적절한 색상 반환
   */
  const getOrganColor = (organId) => {
    // 호버되거나 선택된 장기는 강조색(Teal) 사용
    if (activeOrgan === organId || selectedOrgan === organId) return '#0d9488'; // teal-600
    
    // 기본 상태에서는 위험도에 따라 색상 결정
    const status = organStatus?.[organId] || 'normal';
    switch (status) {
      case 'risk': return '#ef4444'; // red-500
      case 'borderline': return '#f59e0b'; // amber-500
      default: return '#e2e8f0'; // slate-200
    }
  };

  return (
    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-orange-50 flex items-center justify-center min-h-[500px] relative overflow-hidden group">
      {/* 배경 장식용 패턴 */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* 인체 SVG 모델 */}
      <svg viewBox="0 0 200 500" className="w-64 h-full drop-shadow-2xl transition-all duration-500 group-hover:scale-[1.02]">
        {/* 전체 몸체 실루엣 (Base) */}
        <path 
          d="M100 20c-20 0-35 15-35 35s15 35 35 35 35-15 35-35-15-35-35-35zM65 100c-20 0-40 20-40 40v100c0 10 10 20 20 20h20v150c0 20 15 35 35 35s35-15 35-35V260h20c10 0 20-10 20-20V140c0-20-20-40-40-40H65z" 
          fill="#f8fafc"
          stroke="#e2e8f0"
          strokeWidth="2"
        />

        {/* 심장 (Heart): 관상동맥 및 심혈관 건강 지표 시각화 */}
        <path
          id="heart"
          d="M100 130c-5-10-15-10-20-5-5 5-5 15 0 20l20 20 20-20c5-5 5-15 0-20-5-5-15-5-20 5z"
          fill={getOrganColor('heart')}
          className="cursor-pointer transition-all duration-300 hover:filter hover:drop-shadow-[0_0_8px_rgba(20,184,166,0.6)]"
          onMouseEnter={() => onOrganHover('heart')} // 부모 페이지의 리스트 하이라이트 연동
          onMouseLeave={() => onOrganHover(null)}
          onClick={() => onOrganSelect('heart')}
        >
          <title>심장 및 혈관 건강</title>
        </path>

        {/* 간 (Liver): 간 기능 지표(ALT, AST 등) 시각화 */}
        <path
          id="liver"
          d="M85 180h30c5 0 10 5 10 10v15c0 5-5 10-10 10h-30c-5 0-10-5-10-10v-15c0-5 5-10 10-10z"
          fill={getOrganColor('liver')}
          className="cursor-pointer transition-all duration-300"
          onMouseEnter={() => onOrganHover('liver')}
          onMouseLeave={() => onOrganHover(null)}
          onClick={() => onOrganSelect('liver')}
        >
          <title>간 기능 지표 (ALT)</title>
        </path>

        {/* 췌장/혈당 (Pancreas): 공복 혈당 지표 시각화 */}
        <rect
          id="pancreas"
          x="85" y="210" width="30" height="8" rx="4"
          fill={getOrganColor('pancreas')}
          className="cursor-pointer transition-all duration-300"
          onMouseEnter={() => onOrganHover('pancreas')}
          onMouseLeave={() => onOrganHover(null)}
          onClick={() => onOrganSelect('pancreas')}
        >
          <title>췌장 및 공복 혈당</title>
        </rect>

        {/* 혈관 (Vessels): 수축기/이완기 혈압 및 전체 순환계 시각화 */}
        <path
          id="vessels"
          d="M40 140v80M160 140v80M80 300v100M120 300v100"
          fill="none"
          stroke={getOrganColor('vessels')}
          strokeWidth="4"
          strokeLinecap="round"
          className="cursor-pointer transition-all duration-300"
          onMouseEnter={() => onOrganHover('vessels')}
          onMouseLeave={() => onOrganHover(null)}
          onClick={() => onOrganSelect('vessels')}
        >
          <title>혈압 및 신체 순환</title>
        </path>

        {/* 복부 (Abdomen): 대사 증후군 및 복부 비만(허리둘레) 시각화 */}
        <circle
          id="abdomen"
          cx="100" cy="235" r="25"
          fill={getOrganColor('abdomen')}
          fillOpacity="0.4"
          stroke={getOrganColor('abdomen')}
          strokeWidth="2"
          className="cursor-pointer transition-all duration-300"
          onMouseEnter={() => onOrganHover('abdomen')}
          onMouseLeave={() => onOrganHover(null)}
          onClick={() => onOrganSelect('abdomen')}
        >
          <title>복부 비만 (허리둘레)</title>
        </circle>
      </svg>

      {/* 안내 오버레이 */}
      <div className="absolute bottom-8 flex flex-col items-center">
        <div className="w-12 h-1.5 bg-teal-600/20 rounded-full mb-3 overflow-hidden">
          <div className="h-full bg-teal-600 animate-pulse w-1/2"></div>
        </div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">인체 시각화 인터랙티브 모델</p>
        <p className="text-[10px] text-slate-300 mt-1 italic">장기에 마우스를 올려 상세 정보를 확인하세요</p>
      </div>
    </div>
  );
};

export default HumanBodySVG;
