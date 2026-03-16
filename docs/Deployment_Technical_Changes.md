# 배포 관련 주요 변경 사항 및 기술 문서

이 문서는 CareLink 프로젝트의 데이터베이스 마이그레이션(Supabase/PostgreSQL) 및 서버리스 배포(Netlify)를 위해 변경된 핵심 기술 사항을 정리합니다.

---

## 1. 데이터베이스 계층 (Database Layer)

### 하이브리드 커넥터 (`backend/src/config/db.js`)
기존 MySQL 환경과 새로운 PostgreSQL 환경을 동시에 지원하기 위한 지능형 커넥터를 구현했습니다.
- **자동 환경 감지**: `DATABASE_URL` 환경 변수 유무에 따라 `mysql2` 또는 `pg` 라이브러리를 자동으로 선택합니다.
- **SQL 문법 호환성 레이어**: 
  - `?` (MySQL) 플레이스홀더를 `$1, $2...` (PostgreSQL) 형태로 실시간 변환.
  - `NOW()` 함수를 `CURRENT_TIMESTAMP`로 변환.
  - `INSERT` 시 PostgreSQL에서 생성된 ID를 반환받기 위해 자동으로 `RETURNING id` 절 추가.
  - `mysql2`의 결과 구조인 `[rows, fields]` 형식을 모방하여 기존 비즈니스 로직 수정 최소화.

### 스키마 마이그레이션 (`backend/src/config/supabase_init.sql`)
- MySQL 전용 문법(`AUTO_INCREMENT`, `SET ?` 등)을 PostgreSQL 호환 문법(`BIGSERIAL`, `CHECK` 제약 조건, `TIMESTAMP WITH TIME ZONE` 등)으로 변환한 전체 스키마 파일 제공.

---

## 2. 서버 계층 (Server Layer)

### 서버리스 어댑터 (`backend/functions/api.js`)
- `serverless-http`를 사용하여 기존 Express 앱을 Netlify Functions에서 구동 가능한 핸들러로 변환했습니다.

### 파일 업로드 처리 (`backend/src/config/multerConfig.js`)
- **메모리 스토리지 전환**: Netlify Functions는 읽기 전용 파일 시스템을 가지므로, 배포 환경에서는 `multer.diskStorage` 대신 `multer.memoryStorage`를 사용하도록 분기 로직을 추가했습니다.

### 컨트롤러 범용성 최적화 (`backend/src/controllers/reportController.js`)
- MySQL 라이브러리 전용 문법인 `SET ?` 방식의 쿼리를 표준 SQL 형식으로 재작성하여 DB 엔진에 상관없이 동작하도록 개선했습니다.

---

## 3. 프론트엔드 계층 (Frontend Layer)

### 중앙 집중형 API 클라이언트 (`frontend/src/api/axios.js`)
- **Axios 인스턴스화**: 베이스 URL을 `VITE_API_URL` 환경 변수에서 관리하며, 기본값으로 로컬 주소를 설정했습니다.
- **인터셉터(Interceptors)**: 모든 요청 시 `localStorage`에서 토큰을 자동으로 꺼내 `Authorization` 헤더에 삽입하도록 설정하여, 각 페이지에서 중복되던 토큰 처리 코드를 제거했습니다.

### 페이지 코드 리팩토링
- `LoginPage`, `SignupPage`, `MyPage`, `ChatbotPage` 등 주요 페이지에서 하드코딩된 API 주소를 제거하고 공용 클라이언트를 사용하도록 변경했습니다.

---

## 4. 환경 변수 구성 (Environment Variables)

배포 시 다음 변수들을 Netlify/Supabase에 설정해야 합니다.

| 변수명 | 용도 | 예시값 |
| :--- | :--- | :--- |
| `DATABASE_URL` | Supabase DB 연결 문자열 | `postgres://...supabase.com:5432/...` |
| `GEMINI_API_KEY` | 제미나이 AI 분석용 API 키 | `AIzaSy...` |
| `JWT_SECRET` | 사용자 인증 토큰 비밀키 | `carelink-super-secret-key` |
| `VITE_API_URL` | 프론트엔드 API 호출 경로 | `/.netlify/functions/api` |

---
© 2026 CareLink Technical Documentation
