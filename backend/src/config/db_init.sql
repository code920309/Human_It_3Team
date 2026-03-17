-- carelink/backend/src/config/db_init.sql

-- [1] users: 회원 기본 정보 및 인증 상태 관리 테이블
CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE, -- 사용자 로그인 이메일
  password_hash VARCHAR(255) NOT NULL, -- 암호화된 비밀번호
  name VARCHAR(50) NOT NULL, -- 사용자 이름
  birth_date DATE NOT NULL, -- 나이 계산을 위한 생년월일
  gender ENUM('M','F') NOT NULL, -- 성별 (남/여)
  phone VARCHAR(20) NULL, -- 연락처
  email_verified TINYINT(1) DEFAULT 0, -- 이메일 인증 여부
  marketing_agreed TINYINT(1) DEFAULT 0, -- 마케팅 수신 동의 여부
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- [2] health_data: 건강검진 원시 수치 데이터 저장 테이블 (OCR 추출 결과 포함)
CREATE TABLE IF NOT EXISTS health_data (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  exam_year INT NOT NULL, -- 검진 실시 연도
  examined_at DATE NULL, -- 구체적인 검진 일자

  waist DECIMAL(5,2) NULL, -- 허리둘레 (cm)
  blood_pressure_s DECIMAL(5,1) NULL, -- 수축기 혈압
  blood_pressure_d DECIMAL(5,1) NULL, -- 이완기 혈압
  fasting_glucose DECIMAL(6,2) NULL, -- 공복 혈당 (mg/dL)
  tg DECIMAL(6,2) NULL, -- 중성지방 (mg/dL)
  hdl DECIMAL(6,2) NULL, -- HDL 콜레스테롤
  ldl DECIMAL(6,2) NULL, -- LDL 콜레스테롤
  ast DECIMAL(6,2) NULL, -- 간 수치
  alt DECIMAL(6,2) NULL, -- 간 수치
  gamma_gtp DECIMAL(6,2) NULL, -- 간 수치
  bmi DECIMAL(5,2) NULL, -- 체질량지수
  health_score INT NULL, -- 종합 건강 점수 (AI 산출)

  source_type ENUM('manual','ocr','api') DEFAULT 'manual', -- 데이터 획득 경로
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_health_data_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_exam_year (user_id, exam_year)
);

-- [3] ai_reports: Gemini AI가 분석한 세부 리포트 텍스트 및 장기 상태 정보
CREATE TABLE IF NOT EXISTS ai_reports (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  health_data_id BIGINT NOT NULL, -- 대응되는 원시 데이터 ID
  exam_year INT NOT NULL,

  summary TEXT NULL, -- 전체 분석 요약 텍스트
  medical_recommendation TEXT NULL, -- 개인화된 의료 권고
  risk_overview TEXT NULL, -- 주요 위험 요인 (JSON String)

  -- 장기별 위험 등급 (정상/주의/위험)
  organ_heart_status ENUM('normal','borderline','risk','unknown') DEFAULT 'unknown',
  organ_liver_status ENUM('normal','borderline','risk','unknown') DEFAULT 'unknown',
  organ_pancreas_status ENUM('normal','borderline','risk','unknown') DEFAULT 'unknown',
  organ_abdomen_status ENUM('normal','borderline','risk','unknown') DEFAULT 'unknown',
  organ_vessels_status ENUM('normal','borderline','risk','unknown') DEFAULT 'unknown',

  analysis_precision DECIMAL(5,2) NULL, -- AI 분석 신뢰도 (%)
  warning_items_count INT DEFAULT 0, -- 주의/위험 판정 항목 개수

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ai_reports_health_data FOREIGN KEY (health_data_id) REFERENCES health_data(id) ON DELETE CASCADE,
  UNIQUE KEY uq_ai_report_year (user_id, exam_year)
);

-- [4] action_plans: AI가 제안한 일주일 단위 건강 실천 계획
CREATE TABLE IF NOT EXISTS action_plans (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  health_data_id BIGINT NOT NULL,
  exam_year INT NOT NULL,

  diet_plan TEXT NULL, -- 식단 가이드
  exercise_plan TEXT NULL, -- 운동 가이드
  lifestyle_plan TEXT NULL, -- 생활습관 교정

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_action_plans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- [5] chatbot_history: AI 건강 비서와의 상담 내역 저장
CREATE TABLE IF NOT EXISTS chatbot_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  role ENUM('user','assistant') NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chatbot_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
