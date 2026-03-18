-- carelink/backend/src/config/supabase_init.sql
-- Supabase (PostgreSQL) Schema with Enhanced Security Features

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
  marketing_agreed BOOLEAN DEFAULT FALSE, -- 마케팅 동의 여부

  -- [보안/편의 추가]
  login_option VARCHAR(10) DEFAULT 'none', -- none, keep, save_id
  last_login_ip VARCHAR(45) NULL, -- 마지막 접속 IP
  email_change_token VARCHAR(6) NULL, -- 인증 코드 (OTP)
  email_token_expires TIMESTAMP WITH TIME ZONE NULL, -- 인증 만료 시간

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- [보안] 로그아웃된 Refresh Token 블랙리스트 관리
CREATE TABLE IF NOT EXISTS blacklisted_tokens (
  id BIGSERIAL PRIMARY KEY,
  token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 해시
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 만료 시간
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- [2] health_data: 건강검진 결과 수치 데이터
CREATE TABLE IF NOT EXISTS health_data (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_year INT NOT NULL,
  examined_at DATE NULL,
  
  height DECIMAL(5,2) NULL, 
  weight DECIMAL(5,2) NULL,
  waist DECIMAL(5,2) NULL,

  blood_pressure_s DECIMAL(5,1) NULL,
  blood_pressure_d DECIMAL(5,1) NULL,
  fasting_glucose DECIMAL(6,2) NULL,

  tg DECIMAL(6,2) NULL,
  hdl DECIMAL(6,2) NULL,
  ldl DECIMAL(6,2) NULL,
  ast DECIMAL(6,2) NULL,
  alt DECIMAL(6,2) NULL,
  gamma_gtp DECIMAL(6,2) NULL,

  bmi DECIMAL(5,2) NULL,
  health_score INT NULL,

  source_type VARCHAR(10) DEFAULT 'manual', 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, exam_year)
);

-- [3] ai_reports: Gemini AI를 통한 건강 해석
CREATE TABLE IF NOT EXISTS ai_reports (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  health_data_id BIGINT NOT NULL REFERENCES health_data(id) ON DELETE CASCADE,
  exam_year INT NOT NULL,

  summary TEXT NULL,
  medical_recommendation TEXT NULL,
  risk_overview TEXT NULL,

  organ_heart_status VARCHAR(10) DEFAULT 'unknown',
  organ_liver_status VARCHAR(10) DEFAULT 'unknown',
  organ_pancreas_status VARCHAR(10) DEFAULT 'unknown',
  organ_abdomen_status VARCHAR(10) DEFAULT 'unknown',
  organ_vessels_status VARCHAR(10) DEFAULT 'unknown',

  analysis_precision DECIMAL(5,2) NULL,
  warning_items_count INT DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, exam_year)
);

-- [4] action_plans: 맞춤 실천 계획
CREATE TABLE IF NOT EXISTS action_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  health_data_id BIGINT NOT NULL REFERENCES health_data(id) ON DELETE CASCADE,
  
  category VARCHAR(20) NOT NULL,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  difficulty VARCHAR(10) DEFAULT 'medium',
  is_completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- [5] chatbot_history: AI 건강 상담 기록
CREATE TABLE IF NOT EXISTS chatbot_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_year INT NULL,
  role VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
