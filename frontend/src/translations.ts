
export type Language = 'ko' | 'en';

export interface TranslationSchema {
  nav: {
    home: string;
    upload: string;
    mypage: string;
    login: string;
    signup: string;
    logout: string;
    apiKey: string;
  };
  landing: {
    heroTitle: string;
    heroSub: string;
    startBtn: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
  };
  auth: {
    loginTitle: string;
    signupTitle: string;
    loginSub: string;
    signupSub: string;
    name: string;
    gender: string;
    age: string;
    email: string;
    password: string;
    male: string;
    female: string;
    other: string;
    ageUnit: string;
    cancel: string;
    namePlaceholder: string;
    loginBtn: string;
    signupBtn: string;
    noAccount: string;
    hasAccount: string;
    errorProfile: string;
    errorEmailInUse: string;
    errorInvalid: string;
    errorGeneric: string;
  };
  metricNames: Record<string, string>;
  upload: {
    title: string;
    sub: string;
    guestInfoTitle: string;
    guestInfoSub: string;
    dropzone: string;
    dropzoneSub: string;
    analyzeBtn: string;
    analyzingOCR: string;
    analyzingAI: string;
    removeFile: string;
    apiKeyHelp: string;
    errorName: string;
    errorQuota: string;
    errorQuotaConfirm: string;
    errorGeneric: string;
  };
  report: {
    title: string;
    basedOn: string;
    scoreLabel: string;
    aiSummary: string;
    metricsTitle: string;
    editMetrics: string;
    normalRange: string;
    actionPlan: string;
    diet: string;
    exercise: string;
    lifestyle: string;
    presentationMode: string;
    saveTitle: string;
    saveSub: string;
    saveBtn: string;
    danger: string;
    caution: string;
    normal: string;
    modalTitle: string;
    metricName: string;
    metricValue: string;
    metricUnit: string;
    addMetric: string;
    cancel: string;
    saveAndReanalyze: string;
    reanalyzing: string;
    unitPlaceholder: string;
    errorQuota: string;
    errorGeneric: string;
  };
  mypage: {
    titleSuffix: string;
    tabDashboard: string;
    tabHistory: string;
    scoreTrend: string;
    bloodSugarTrend: string;
    cholesterolTrend: string;
    recentStatus: string;
    date: string;
    score: string;
    viewDetail: string;
    noReports: string;
    firstUpload: string;
    healthTipTitle: string;
    tip1: string;
    tip2: string;
    mainStatus: string;
    manage: string;
    allNormal: string;
    noHistory: string;
  };
  presentation: {
    scoreTitle: string;
    riskTitle: string;
    planTitle: string;
    allNormal: string;
    slide: string;
    of: string;
    prev: string;
    next: string;
  };
  chatbot: {
    placeholder: string;
    welcome: string;
    guestWelcome: string;
    errorQuota: string;
    errorGeneric: string;
  };
  footer: {
    rights: string;
    privacy: string;
    terms: string;
    contact: string;
  };
}

export const translations: Record<Language, TranslationSchema> = {
  ko: {
    nav: {
      home: '홈',
      upload: '업로드',
      mypage: '마이페이지',
      login: '로그인',
      signup: '회원가입',
      logout: '로그아웃',
      apiKey: 'API 키 설정'
    },
    landing: {
      heroTitle: 'AI가 분석하는\n당신의 건강 리포트',
      heroSub: '복잡한 건강검진 결과표를 한눈에 이해하기 쉽게 분석해드립니다.\n개인 맞춤형 건강 관리의 시작, CareLink와 함께하세요.',
      startBtn: '지금 바로 분석하기',
      feature1Title: '정밀한 AI 분석',
      feature1Desc: '최신 AI 기술로 수치 뒤에 숨겨진 의미를 찾아냅니다.',
      feature2Title: '맞춤형 액션 플랜',
      feature2Desc: '당신의 결과에 딱 맞는 식단과 운동 가이드를 제공합니다.',
      feature3Title: '지속적인 추적',
      feature3Desc: '과거 데이터와 비교하여 건강 변화를 한눈에 확인하세요.'
    },
    auth: {
      loginTitle: '환영합니다',
      signupTitle: '계정 생성',
      loginSub: 'CareLink에 로그인하여 건강을 관리하세요',
      signupSub: 'CareLink와 함께 건강한 삶을 시작하세요',
      name: '이름',
      gender: '성별',
      age: '나이',
      email: '이메일',
      password: '비밀번호',
      male: '남성',
      female: '여성',
      other: '기타',
      ageUnit: '세',
      cancel: '취소',
      namePlaceholder: '홍길동',
      loginBtn: '로그인',
      signupBtn: '회원가입',
      noAccount: '계정이 없으신가요?',
      hasAccount: '이미 계정이 있으신가요?',
      errorProfile: '사용자 프로필을 찾을 수 없습니다.',
      errorEmailInUse: '이미 사용 중인 이메일입니다.',
      errorInvalid: '이메일 또는 비밀번호가 올바르지 않습니다.',
      errorGeneric: '오류가 발생했습니다: '
    },
    metricNames: {
      '공복혈당': 'Fasting Blood Sugar',
      '총콜레스테롤': 'Total Cholesterol',
      'LDL 콜레스테롤': 'LDL Cholesterol',
      'HDL 콜레스테롤': 'HDL Cholesterol',
      '중성지방': 'Triglycerides',
      '수축기 혈압': 'Systolic Blood Pressure',
      '이완기 혈압': 'Diastolic Blood Pressure',
      '체질량지수': 'BMI',
      '체질량지수(BMI)': 'BMI',
      'AST(SGOT)': 'AST (SGOT)',
      'ALT(SGPT)': 'ALT (SGPT)',
      '감마지티피(GGT)': 'GGT',
      '요단백': 'Urine Protein',
      '혈색소': 'Hemoglobin',
      '신사구체여과율(e-GFR)': 'e-GFR'
    },
    upload: {
      title: '건강검진 결과 업로드',
      sub: '이미지 또는 PDF 파일을 업로드하면 AI가 분석을 시작합니다.',
      guestInfoTitle: '기본 정보 입력',
      guestInfoSub: '정확한 분석을 위해 나이와 성별이 필요합니다.',
      dropzone: '파일을 드래그하거나 클릭하여 업로드하세요',
      dropzoneSub: '이미지(JPG, PNG) 또는 PDF 파일',
      analyzeBtn: '분석 시작하기',
      analyzingOCR: '텍스트 추출 중...',
      analyzingAI: 'AI 분석 중...',
      removeFile: '파일 삭제',
      apiKeyHelp: 'API 키 설정 도움말',
      errorName: '이름을 입력해주세요.',
      errorQuota: '현재 무료 분석 할당량이 초과되었습니다. 본인의 API 키를 등록해주세요.',
      errorQuotaConfirm: '무료 할당량이 초과되었습니다. 본인의 API 키를 설정하시겠습니까?',
      errorGeneric: '분석 중 오류가 발생했습니다. 다시 시도해주세요.'
    },
    report: {
      title: 'AI 건강 분석 리포트',
      basedOn: '{date} 검진 결과 기반',
      scoreLabel: 'Health Score',
      aiSummary: 'AI 요약',
      metricsTitle: '주요 지표 분석',
      editMetrics: '지표 수정/추가',
      normalRange: '정상 범위',
      actionPlan: '맞춤형 액션 플랜',
      diet: '추천 식단',
      exercise: '운동 가이드',
      lifestyle: '생활 습관',
      presentationMode: '발표 모드로 보기',
      saveTitle: '이 결과를 저장할까요?',
      saveSub: '회원가입을 하시면 지금 분석된 리포트를 영구적으로 보관하고, 과거 기록과 비교 분석할 수 있습니다.',
      saveBtn: '30초만에 가입하고 저장하기',
      danger: '위험',
      caution: '주의',
      normal: '정상',
      modalTitle: '검진 지표 수정',
      metricName: '항목명',
      metricValue: '수치',
      metricUnit: '단위',
      addMetric: '지표 추가',
      cancel: '취소',
      saveAndReanalyze: '저장 및 재분석',
      reanalyzing: '재분석 중...',
      unitPlaceholder: 'mg/dL 등',
      errorQuota: '할당량이 초과되었습니다.',
      errorGeneric: '오류가 발생했습니다.'
    },
    mypage: {
      titleSuffix: '님의 건강 대시보드',
      tabDashboard: '대시보드',
      tabHistory: '분석 기록',
      scoreTrend: '건강 점수 변화 추이',
      bloodSugarTrend: '혈당 변화 (mg/dL)',
      cholesterolTrend: '콜레스테롤 변화 (mg/dL)',
      recentStatus: '최근 검사 요약',
      date: '검사일',
      score: '건강 점수',
      viewDetail: '상세 리포트 보기',
      noReports: '아직 검진 기록이 없습니다.',
      firstUpload: '첫 검진 결과 업로드하기',
      healthTipTitle: '건강 팁',
      tip1: '하루 30분 가벼운 산책은 심혈관 건강에 큰 도움이 됩니다.',
      tip2: '충분한 수분 섭취는 신진대사를 활발하게 합니다.',
      mainStatus: '주요 상태',
      manage: '관리',
      allNormal: '모두 정상',
      noHistory: '기록이 없습니다.'
    },
    presentation: {
      scoreTitle: '건강 종합 점수',
      riskTitle: '주요 위험 요소',
      planTitle: '개선 방향 및 액션 플랜',
      allNormal: '모든 지표가 정상입니다!',
      slide: '슬라이드',
      of: '/',
      prev: '이전',
      next: '다음'
    },
    chatbot: {
      placeholder: '건강에 대해 궁금한 점을 물어보세요...',
      welcome: '안녕하세요! 당신의 건강 파트너 CareLink AI입니다. 분석 결과나 일반적인 건강 관리에 대해 궁금한 점이 있으신가요?',
      guestWelcome: '안녕하세요, {name}님! 분석 결과를 바탕으로 궁금한 점이 있으시면 언제든 물어보세요.',
      errorQuota: '현재 무료 분석 할당량이 초과되었습니다. 계속하시려면 우측 상단의 \'API 키 설정\' 또는 업로드 페이지 하단의 설정을 통해 본인의 API 키를 등록해주세요.',
      errorGeneric: '죄송합니다. 오류가 발생했습니다.'
    },
    footer: {
      rights: '© 2026 CareLink. 모든 권리 보유. AI 기반 헬스케어 관리.',
      privacy: '개인정보 처리방침',
      terms: '이용약관',
      contact: '고객 지원'
    }
  },
  en: {
    nav: {
      home: 'Home',
      upload: 'Upload',
      mypage: 'My Page',
      login: 'Login',
      signup: 'Sign Up',
      logout: 'Logout',
      apiKey: 'API Key Settings'
    },
    landing: {
      heroTitle: 'Your Health Report\nAnalyzed by AI',
      heroSub: 'We analyze complex health checkup results to be easily understood at a glance.\nStart your personalized health management with CareLink.',
      startBtn: 'Analyze Now',
      feature1Title: 'Precise AI Analysis',
      feature1Desc: 'Discover the meaning behind the numbers with latest AI technology.',
      feature2Title: 'Personalized Action Plan',
      feature2Desc: 'Get diet and exercise guides perfectly tailored to your results.',
      feature3Title: 'Continuous Tracking',
      feature3Desc: 'Compare with past data to see your health changes at a glance.'
    },
    auth: {
      loginTitle: 'Welcome Back',
      signupTitle: 'Create Account',
      loginSub: 'Log in to CareLink to manage your health',
      signupSub: 'Start a healthy life with CareLink',
      name: 'Name',
      gender: 'Gender',
      age: 'Age',
      email: 'Email',
      password: 'Password',
      male: 'Male',
      female: 'Female',
      other: 'Other',
      ageUnit: 'y/o',
      cancel: 'Cancel',
      namePlaceholder: 'John Doe',
      loginBtn: 'Login',
      signupBtn: 'Sign Up',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      errorProfile: 'User profile not found.',
      errorEmailInUse: 'Email already in use.',
      errorInvalid: 'Invalid email or password.',
      errorGeneric: 'An error occurred: '
    },
    metricNames: {
      'Fasting Blood Sugar': '공복혈당',
      'Total Cholesterol': '총콜레스테롤',
      'LDL Cholesterol': 'LDL 콜레스테롤',
      'HDL Cholesterol': 'HDL 콜레스테롤',
      'Triglycerides': '중성지방',
      'Systolic Blood Pressure': '수축기 혈압',
      'Diastolic Blood Pressure': '이완기 혈압',
      'BMI': '체질량지수',
      'AST (SGOT)': 'AST(SGOT)',
      'ALT (SGPT)': 'ALT(SGPT)',
      'GGT': '감마지티피(GGT)',
      'Urine Protein': '요단백',
      'Hemoglobin': '혈색소',
      'e-GFR': '신사구체여과율(e-GFR)'
    },
    upload: {
      title: 'Upload Health Report',
      sub: 'Upload an image or PDF file to start AI analysis.',
      guestInfoTitle: 'Basic Information',
      guestInfoSub: 'Age and gender are required for accurate analysis.',
      dropzone: 'Drag and drop or click to upload',
      dropzoneSub: 'Image (JPG, PNG) or PDF file',
      analyzeBtn: 'Start Analysis',
      analyzingOCR: 'Extracting text...',
      analyzingAI: 'AI Analyzing...',
      removeFile: 'Remove File',
      apiKeyHelp: 'API Key Help',
      errorName: 'Please enter your name.',
      errorQuota: 'Free analysis quota exceeded. Please register your own API key.',
      errorQuotaConfirm: 'Free quota exceeded. Would you like to set your own API key?',
      errorGeneric: 'An error occurred during analysis. Please try again.'
    },
    report: {
      title: 'AI Health Analysis Report',
      basedOn: 'Based on {date} checkup',
      scoreLabel: 'Health Score',
      aiSummary: 'AI Summary',
      metricsTitle: 'Key Metrics Analysis',
      editMetrics: 'Edit/Add Metrics',
      normalRange: 'Ref. Range',
      actionPlan: 'Personalized Action Plan',
      diet: 'Recommended Diet',
      exercise: 'Exercise Guide',
      lifestyle: 'Lifestyle',
      presentationMode: 'View in Presentation Mode',
      saveTitle: 'Save this result?',
      saveSub: 'Sign up to keep this report permanently and compare it with past records.',
      saveBtn: 'Sign up in 30s and save',
      danger: 'Danger',
      caution: 'Caution',
      normal: 'Normal',
      modalTitle: 'Edit Health Metrics',
      metricName: 'Metric Name',
      metricValue: 'Value',
      metricUnit: 'Unit',
      addMetric: 'Add Metric',
      cancel: 'Cancel',
      saveAndReanalyze: 'Save & Reanalyze',
      reanalyzing: 'Reanalyzing...',
      unitPlaceholder: 'e.g. mg/dL',
      errorQuota: 'Quota exceeded.',
      errorGeneric: 'An error occurred.'
    },
    mypage: {
      titleSuffix: "'s Health Dashboard",
      tabDashboard: 'Dashboard',
      tabHistory: 'History',
      scoreTrend: 'Health Score Trend',
      bloodSugarTrend: 'Blood Sugar Trend (mg/dL)',
      cholesterolTrend: 'Cholesterol Trend (mg/dL)',
      recentStatus: 'Recent Health Summary',
      date: 'Date',
      score: 'Health Score',
      viewDetail: 'View Detail',
      noReports: 'No health records yet.',
      firstUpload: 'Upload your first checkup result',
      healthTipTitle: 'Health Tips',
      tip1: 'A 30-minute light walk daily is great for cardiovascular health.',
      tip2: 'Drinking enough water boosts your metabolism.',
      mainStatus: 'Main Status',
      manage: 'Manage',
      allNormal: 'All Normal',
      noHistory: 'No history found.'
    },
    presentation: {
      scoreTitle: 'Overall Health Score',
      riskTitle: 'Key Risk Factors',
      planTitle: 'Improvement & Action Plan',
      allNormal: 'All metrics are normal!',
      slide: 'Slide',
      of: 'of',
      prev: 'Prev',
      next: 'Next'
    },
    chatbot: {
      placeholder: 'Ask anything about your health...',
      welcome: 'Hello! I am CareLink AI, your health partner. Do you have any questions about your analysis results or general health management?',
      guestWelcome: 'Hello, {name}! Feel free to ask any questions based on the analysis results.',
      errorQuota: 'Free analysis quota exceeded. To continue, please register your own API key via \'API Key Settings\' at the top right or settings at the bottom of the upload page.',
      errorGeneric: 'Sorry, an error occurred.'
    },
    footer: {
      rights: '© 2026 CareLink. All rights reserved. AI-powered healthcare management.',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      contact: 'Contact Support'
    }
  }
};
