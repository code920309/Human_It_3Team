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
- **데이터 타입 호환성**: PostgreSQL의 `BOOLEAN` 타입과 MySQL의 `TINYINT(1)` 간의 호환성을 위해 컨트롤러 레벨에서 전역적으로 `1/0`을 `true/false`로 명시적 변환했습니다.

### 연결 방식 최적화 (Pooler)
- IPv4 환경(국내 일반 인터넷)에서 Supabase의 기본 IPv6 주소에 접속하지 못하는 문제를 해결하기 위해 **Transaction Pooler (포트 6543)** 방식을 적용했습니다.

---

## 2. 서버 계층 (Server Layer)

### 서버리스 어댑터 (`backend/functions/api.js` & `app.js`)
- `serverless-http`를 사용하여 Express 앱을 Netlify Functions 핸들러로 변환했습니다.
- **라우팅 접두어 처리**: Netlify 환경에서 붙는 `/.netlify/functions/api` 접두어를 Express 라우터가 유연하게 인식하도록 `app.js`의 라우팅 구조를 개선했습니다.
- **서버리스 바디 파서 보강**: 특정 서버리스 환경에서 `req.body`가 유실되는 현상을 막기 위해 `express.json()` 외에 `req.rawBody`를 직접 파싱하는 Fallback 미들웨어를 추가했습니다.

### 종속성 관리 (Dependencies)
- **Root `package.json` 도입**: Netlify의 빌드 시스템(esbuild)이 백엔드 라이브러리(`express`, `pg` 등)를 인식할 수 있도록 프로젝트 루트에 백엔드 종속성이 포함된 `package.json`을 명시적으로 생성했습니다.

### 파일 업로드 처리 (`backend/src/config/multerConfig.js`)
- **메모리 스토리지 전환**: Netlify Functions의 읽기 전용 파일 시스템 한계를 극복하기 위해 `multer.memoryStorage`를 사용하도록 로직을 분기했습니다.

---

## 3. 프론트엔드 계층 (Frontend Layer)

### 중앙 집중형 API 클라이언트 (`frontend/src/api/axios.js`)
- **Axios 인스턴스화**: 베이스 URL을 `VITE_API_URL` 환경 변수에서 관리하며, 기본값으로 로컬 주소를 설정했습니다.
- **인터셉터(Interceptors)**: 모든 요청 시 `localStorage`에서 토큰을 자동으로 꺼내 `Authorization` 헤더에 삽입하도록 설정했습니다.

### React 환경 최적화
- 리팩토링 과정에서 누락될 수 있는 `React` 및 훅(`useState`, `useEffect` 등) 임포트를 전수 점검하여 배포 환경에서 `ReferenceError`가 발생하지 않도록 조치했습니다.

---

## 4. 자동화 스크립트 (Automation)

신규 환경 구축을 위해 다음 스크립트들을 추가했습니다:
- `backend/src/init_db.js`: Supabase에 전체 테이블 스키마 자동 생성.
- `backend/src/seed.js`: 테스트용 사용자(`test@test.com`) 및 건강 리포트 샘플 데이터 삽입.

---

## 5. 환경 변수 구성 (Environment Variables)

배포 시 다음 변수들을 Netlify에 반드시 설정해야 합니다.

| 변수명 | 용도 | 권장 형식 |
| :--- | :--- | :--- |
| `DATABASE_URL` | Supabase DB 연결 문자열 | `postgres://...pooler.supabase.com:6543/...` |
| `GEMINI_API_KEY` | 제미나이 AI 분석용 API 키 | `AIzaSy...` |
| `JWT_SECRET` | 사용자 인증 토큰 비밀키 | (무작위 문자열) |
| `VITE_API_URL` | 프론트엔드 API 호출 경로 | `/.netlify/functions/api` |

---
© 2026 CareLink Technical Documentation
