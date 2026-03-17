-- carelink/backend/src/config/supabase_init.sql
-- Supabase (PostgreSQL) Schema with Korean Comments

-- [1] users: 회원 정보 및 서비스 설정 관리
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE, -- 로그인용 이메일
  password_hash VARCHAR(255) NOT NULL, -- 해시된 비밀번호
  name VARCHAR(50) NOT NULL, -- 사용자 실명
  birth_date DATE NOT NULL, -- 연령대 분석을 위한 생년월일
  gender VARCHAR(1) CHECK (gender IN ('M', 'F')) NOT NULL, -- M: 남성, F: 여성
  phone VARCHAR(20) NULL, -- 연락처
  email_verified BOOLEAN DEFAULT FALSE, -- 이메일 인증 여부
  marketing_agreed BOOLEAN DEFAULT FALSE, -- 마케팅 동의 여부 (GDPR/KISA 준수)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- [2] health_data: 건강검진 결과 수치 데이터 (OCR 및 직접 입력)
CREATE TABLE IF NOT EXISTS health_data (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_year INT NOT NULL, -- 건강검진 실시 연도
  examined_at DATE NULL, -- 실제 검진일
  
  -- 신체 계측 데이터
  height DECIMAL(5,2) NULL, 
  weight DECIMAL(5,2) NULL,
  waist DECIMAL(5,2) NULL, -- 복부 비만 지표 (cm)

  -- 혈압 및 혈당
  blood_pressure_s DECIMAL(5,1) NULL, -- 수축기 혈압
  blood_pressure_d DECIMAL(5,1) NULL, -- 이완기 혈압
  fasting_glucose DECIMAL(6,2) NULL, -- 공복 혈당 (당뇨 관리)

  -- 지질 및 간 기능
  tg DECIMAL(6,2) NULL, -- 중성지방
  hdl DECIMAL(6,2) NULL, -- 고밀도 콜레스테롤
  ldl DECIMAL(6,2) NULL, -- 저밀도 콜레스테롤
  ast DECIMAL(6,2) NULL, -- 간 수치
  alt DECIMAL(6,2) NULL, -- 간 수치
  gamma_gtp DECIMAL(6,2) NULL, -- 간 수치

  bmi DECIMAL(5,2) NULL, -- 체질량지수
  health_score INT NULL, -- AI가 산출한 100점 만점 건강 점수

  source_type VARCHAR(10) DEFAULT 'manual', -- manual (직접입력), ocr (이미지분석), api (건강보험공단 등)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, exam_year)
);

-- [3] ai_reports: Gemini AI를 통한 건강 해석 및 인사이트
CREATE TABLE IF NOT EXISTS ai_reports (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  health_data_id BIGINT NOT NULL REFERENCES health_data(id) ON DELETE CASCADE,
  exam_year INT NOT NULL,

  summary TEXT NULL, -- 전체 분석 요약 텍스트 (한국어)
  medical_recommendation TEXT NULL, -- 맞춤형 생활 수칙 및 권고
  risk_overview TEXT NULL, -- 주요 위험 요인 목록 (JSON 포맷의 문자열)

  -- 장기별 건강 등급 (normal: 정상, borderline: 주의, risk: 위험)
  organ_heart_status VARCHAR(10) DEFAULT 'unknown',
  organ_liver_status VARCHAR(10) DEFAULT 'unknown',
  organ_pancreas_status VARCHAR(10) DEFAULT 'unknown',
  organ_abdomen_status VARCHAR(10) DEFAULT 'unknown',
  organ_vessels_status VARCHAR(10) DEFAULT 'unknown',

  analysis_precision DECIMAL(5,2) NULL, -- AI 분석 결과의 신뢰도 수치
  warning_items_count INT DEFAULT 0, -- 집중 관리가 필요한 건강 항목 개수

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, exam_year)
);

-- [4] action_plans: 일상 건강 관리를 위한 맞춤 실천 계획
CREATE TABLE IF NOT EXISTS action_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  health_data_id BIGINT NOT NULL REFERENCES health_data(id) ON DELETE CASCADE,
  
  category VARCHAR(20) NOT NULL, -- meal (식단), exercise (운동), lifestyle (생활습관)
  title VARCHAR(100) NOT NULL, -- 액션 플랜 제목
  content TEXT NOT NULL, -- 상세 실천 방법
  difficulty VARCHAR(10) DEFAULT 'medium', -- 난이도: easy, medium, hard
  is_completed BOOLEAN DEFAULT FALSE, -- 실천 여부 체크

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- [5] chatbot_history: AI 건강 상담사와의 대화 기록
CREATE TABLE IF NOT EXISTS chatbot_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_year INT NULL,
  role VARCHAR(10) NOT NULL, -- user (사용자), assistant (AI)
  message TEXT NOT NULL, -- 대화 내용
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
