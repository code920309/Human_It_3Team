-- Supabase (PostgreSQL) Schema for CareLink

-- users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(50) NOT NULL,
  birth_date DATE NOT NULL,
  gender VARCHAR(1) CHECK (gender IN ('M', 'F')) NOT NULL,
  phone VARCHAR(20) NULL,
  login_option VARCHAR(10) DEFAULT 'none',
  email_verified BOOLEAN DEFAULT FALSE,
  email_change_token VARCHAR(6) NULL,
  email_change_pending VARCHAR(255) NULL,
  email_token_expires TIMESTAMP WITH TIME ZONE NULL,
  marketing_agreed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- health_data table
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

  hba1c DECIMAL(4,2) NULL,
  egfr DECIMAL(6,2) NULL,
  hemoglobin DECIMAL(5,2) NULL,

  bmi DECIMAL(5,2) NULL,
  health_score INT NULL,

  source_type VARCHAR(10) DEFAULT 'manual',
  ocr_confidence DECIMAL(5,2) NULL,
  verification_status VARCHAR(10) DEFAULT 'pending',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, exam_year)
);

-- ai_reports table
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

-- action_plans table
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

-- chatbot_history table
CREATE TABLE IF NOT EXISTS chatbot_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_year INT NULL,
  role VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NULL,
  name VARCHAR(100),
  email VARCHAR(255),
  message TEXT,
  status VARCHAR(10) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  rating SMALLINT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
