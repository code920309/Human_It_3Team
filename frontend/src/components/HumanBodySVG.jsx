/**
 * HumanBodySVG 컴포넌트 - 장기 SVG만 렌더링 (레이블 없음)
 * 레이블/범례는 HealthReport.jsx에서 외부에 배치
 */
const HumanBodySVG = ({ organStatus, activeOrgan, onOrganHover, selectedOrgan, onOrganSelect }) => {

  const getOrganColor = (id) => {
    if (selectedOrgan === id) {
      const status = organStatus?.[id] || 'normal';
      if (status === 'risk')       return '#ef4444';
      if (status === 'borderline') return '#f59e0b';
      return '#14b8a6';
    }
    return activeOrgan === id ? '#64748b' : '#94a3b8';
  };

  const getFilter = (id) => {
    if (selectedOrgan === id) return 'url(#activeGlow)';
    if (activeOrgan === id)   return 'url(#greyGlow)';
    return 'none';
  };

  const bind = (id) => ({
    style: {
      cursor: 'pointer',
      transformBox: 'fill-box',
      transformOrigin: 'center',
      transform: activeOrgan === id ? 'scale(1.12)' : 'scale(1)',
      transition: 'transform 0.18s ease',
    },
    onClick: () => onOrganSelect(id),
    onMouseEnter: () => onOrganHover(id),
    onMouseLeave: () => onOrganHover(null),
  });

  return (
    <svg viewBox="0 0 300 340" className="w-full h-auto">
      <defs>
        <filter id="greyGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="activeGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="9" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* 인체 실루엣 (상체만 - 허리까지) */}
      <ellipse cx="150" cy="42" rx="32" ry="38" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.7"/>
      <path
        d="M118 85 C100 90 88 110 88 135 L88 230 C88 240 94 248 102 250
           L100 310 Q100 330 120 332 L180 332 Q200 330 200 310 L198 250
           C206 248 212 240 212 230 L212 135
           C212 110 200 90 182 85 Z"
        fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.6"
      />

      {/* ===== 혈관 (Vessels) ===== */}
      <g {...bind('vessels')} filter={getFilter('vessels')}>
        <path d="M150 75 Q136 88 128 110 Q122 130 126 152" fill="none" stroke={getOrganColor('vessels')} strokeWidth="4.0" strokeLinecap="round" opacity="0.9"/>
        <path d="M150 75 Q164 88 172 110 Q178 130 174 152" fill="none" stroke={getOrganColor('vessels')} strokeWidth="4.0" strokeLinecap="round" opacity="0.9"/>
        <path d="M150 95 L150 310" fill="none" stroke={getOrganColor('vessels')} strokeWidth="3.0" strokeLinecap="round" opacity="0.75"/>
        <path d="M142 305 Q136 318 130 330" fill="none" stroke={getOrganColor('vessels')} strokeWidth="3.0" strokeLinecap="round" opacity="0.7"/>
        <path d="M158 305 Q164 318 170 330" fill="none" stroke={getOrganColor('vessels')} strokeWidth="3.0" strokeLinecap="round" opacity="0.7"/>
        <title>혈관 및 순환계</title>
      </g>

      {/* ===== 심장 (Heart) ===== */}
      <g {...bind('heart')} filter={getFilter('heart')}>
        <path
          d="M 116 178
             C 98 168, 93 153, 100 145
             C 107 137, 116 141, 116 150
             C 116 141, 125 137, 132 145
             C 139 153, 134 168, 116 178 Z"
          fill={getOrganColor('heart')} opacity="0.92"
        />
        <line x1="116" y1="151" x2="116" y2="168" stroke="#ffffff" strokeWidth="1" opacity="0.5"/>
        <title>심장 (Heart)</title>
      </g>

      {/* ===== 간 (Liver) - 쌍엽 실루엣 ===== */}
      <g {...bind('liver')} filter={getFilter('liver')}>
        <path
          d="M 158 209
             C 157 200, 160 191, 169 189
             C 175 187, 181 191, 186 196
             C 190 191, 200 185, 209 187
             C 218 189, 222 200, 220 210
             C 218 218, 211 222, 202 223
             C 195 225, 189 222, 185 222
             C 183 227, 179 232, 174 230
             C 168 228, 161 221, 159 214 Z"
          fill={getOrganColor('liver')} opacity="0.86"
        />
        <ellipse cx="178" cy="229" rx="5" ry="4" fill={getOrganColor('liver')} opacity="0.72"/>
        <title>간 (Liver)</title>
      </g>

      {/* ===== 췌장 (Pancreas) - 간 위로 이동 ===== */}
      <g {...bind('pancreas')} filter={getFilter('pancreas')}>
        <path
          d="M 155 182
             C 151 177, 147 176, 143 178
             C 139 176, 135 175, 131 178
             C 127 176, 123 177, 119 182
             C 121 187, 125 189, 129 186
             C 133 189, 137 190, 141 186
             C 145 189, 149 188, 155 182 Z"
          fill={getOrganColor('pancreas')} opacity="0.88"
        />
        <title>췌장 (Pancreas)</title>
      </g>

      {/* ===== 복부 (Abdomen) - 기존 췌장 위치로 이동 ===== */}
      <g {...bind('abdomen')} filter={getFilter('abdomen')}>
        <ellipse cx="150" cy="255" rx="38" ry="32" fill={getOrganColor('abdomen')} opacity="0.32" stroke={getOrganColor('abdomen')} strokeWidth="2" strokeDasharray="4,3"/>
        <circle cx="150" cy="255" r="16" fill={getOrganColor('abdomen')} opacity="0.65"/>
        <title>복부 (Abdomen)</title>
      </g>
    </svg>
  );
};

export default HumanBodySVG;
