# CareLink - AI 기반 건강검진 분석 플랫폼

CareLink는 복잡한 건강검진 결과를 AI(Gemini)를 통해 쉽게 분석하고, 개인화된 건강 관리 액션 플랜과 AI 상담을 제공하는 웹 플랫폼입니다.

> **배포 이슈 안내 (2026-03-16)**
> 현재 Netlify 배포 환경에서 클라이언트 데이터 수신 불가 이슈(Body 유실)가 확인되었습니다.
> 자세한 내용은 [배포 상태 리포트](docs/4.CareLink_Deployment_Guide.md)를 참고해주세요.
> 로컬 환경에서는 정상 동작합니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| AI 건강검진 분석 | 결과지 이미지(OCR) 또는 수동 입력으로 AI 정밀 분석 리포트 생성 |
| 건강 대시보드 | 점수화된 건강 요약 및 추이 그래프 시각화 |
| 맞춤형 액션 플랜 | 현재 건강 상태에 최적화된 식단·운동 미션 제공 |
| AI 건강 상담 | 챗봇을 통한 개인 건강 데이터 기반 1:1 상담 |
| 마이페이지 | 회원 정보 관리 및 검진 기록 이력 조회 |

---

## 기술 스택

### Frontend
- **React** v19 (Vite v6)
- **TypeScript** v5.8
- **Tailwind CSS** v4
- **React Router DOM** v7 — 클라이언트 라우팅
- **Axios** — HTTP 클라이언트
- **Framer Motion** v12 — 애니메이션
- **Recharts** v3 — 차트
- **Swiper** v12 — 슬라이더
- **Lucide React** — 아이콘
- **React Markdown** v10 — AI 응답 마크다운 렌더링
- **Gemini API** (`@google/genai`) — 클라이언트 AI 연동

### Backend
- **Node.js** v20 / **Express** v5
- **MySQL2** / **PostgreSQL (pg)** — DB 드라이버
- **Supabase** — 클라우드 DB
- **Gemini API** (`@google/generative-ai`) — AI 분석
- **JWT** (`jsonwebtoken`) — 인증
- **bcryptjs** — 비밀번호 해싱
- **Multer** — 파일 업로드
- **CORS** / **cookie-parser** — 미들웨어
- **serverless-http** — Netlify Functions 연동

### Deployment
- **Netlify** — Serverless Functions + Static Hosting

---

## 프로젝트 구조

```
Human_It_3Team/
├── frontend/               # React 클라이언트
│   └── src/
│       ├── pages/          # 페이지 컴포넌트
│       │   ├── HomePage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── SignupPage.jsx
│       │   ├── UploadPage.jsx       # 검진 결과 업로드
│       │   ├── HealthReport.jsx     # AI 분석 리포트
│       │   ├── ActionPlanPage.jsx   # 맞춤형 액션 플랜
│       │   ├── ChatbotPage.jsx      # AI 상담 챗봇
│       │   └── MyPage.jsx           # 마이페이지
│       ├── components/     # 공통 컴포넌트
│       ├── api/            # API 호출 모듈
│       └── context/        # 전역 상태 관리
├── backend/                # Node.js 서버
│   └── src/
│       ├── routes/         # API 라우트
│       ├── controllers/    # 비즈니스 로직
│       ├── services/       # 외부 서비스 연동 (Gemini 등)
│       ├── config/         # DB 설정 및 초기화 SQL
│       └── app.js          # 서버 진입점
├── docs/                   # 기술 문서
└── netlify.toml            # Netlify 배포 설정
```

---

## 시작하기

### 요구 사항

- Node.js v20 이상
- MySQL 또는 Supabase 계정
- Google Gemini API 키

### 1. 저장소 클론

```bash
git clone <repository-url>
cd Human_It_3Team
```

### 2. 환경 변수 설정

`backend/` 폴더에 `.env` 파일을 생성합니다.

```env
# 서버
PORT=5000

# 로컬 MySQL 사용 시
DB_HOST=localhost
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=carelink

# Supabase 사용 시 (배포 환경)
DATABASE_URL=your_supabase_connection_uri

# 인증 & AI
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

`frontend/` 폴더에 `.env` 파일을 생성합니다.

```env
VITE_API_URL=http://localhost:5000
```

### 3. 백엔드 실행

```bash
cd backend
npm install
npm run dev
```

> `npm run dev` 가 동작하지 않을 경우: `node src/app.js`

### 4. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

---

## 배포 가이드 (Netlify + Supabase)

### Step 1: 데이터베이스 (Supabase)

1. [Supabase](https://supabase.com) 프로젝트 생성
2. **SQL Editor**에서 `backend/src/config/supabase_init.sql` 내용 실행
3. **Project Settings > Database > Connection String (URI)** 복사

### Step 2: Netlify 배포

1. Netlify에서 GitHub 리포지토리 연결
2. **Site Settings > Environment variables** 에서 아래 변수 추가:

| 변수명 | 값 |
|--------|-----|
| `DATABASE_URL` | Supabase Connection URI |
| `JWT_SECRET` | 랜덤 보안 키 |
| `GEMINI_API_KEY` | Gemini API 키 |
| `VITE_API_URL` | `/.netlify/functions/api` |

3. Build 설정:
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/dist`

---

## 문서

| 문서 | 설명 |
|------|------|
| [배포 가이드](docs/4.CareLink_Deployment_Guide.md) | Netlify 배포 상세 설정 |
| [기술 리포트](docs/4.CareLink_Technical_Report.md) | 시스템 아키텍처 및 기술 선택 근거 |
| [마이페이지 문서](docs/4.Mypage_Documentation.md) | 마이페이지 기능 명세 |
| [GitHub 클론 가이드](docs/github_clone_guide.md) | 팀원용 개발 환경 세팅 가이드 |

---

## 배포 링크

| 환경 | URL |
|------|-----|
| Production | [https://carelinkhuman.netlify.app](https://carelinkhuman.netlify.app) |
| 테스트 계정 | `test@test.com` / `password123` |

> 현재 Netlify 배포 환경에서 Body 유실 이슈가 확인되어, 일부 기능은 로컬 환경에서만 정상 동작할 수 있습니다.

---

## 트러블슈팅

### Serverless Body 파편화 문제 (핵심 이슈)

**증상**

Netlify 배포 환경에서 로그인·회원가입 등 POST 요청 시 "가입되지 않은 이메일" 오류 반환. 로컬에서는 정상 동작.

**원인 분석 과정**

초기에는 DB 연결 문제로 오인하여 아래 작업을 반복 수행:
- Supabase Connection String IPv4/IPv6 전환 (3회 재빌드)
- SSL 모드 (`?sslmode=require`) 조정 (4회 재빌드)
- MySQL `?` → PostgreSQL `$n` 플레이스홀더 파서 수정 (5회 이상)
- Supabase RLS(Row Level Security) 권한 변경

→ 총 **15회 빌드, 약 150 Credits** 소모했으나 에러 변화 없음.

**실제 원인**

Netlify Functions(AWS Lambda 기반)가 대형 페이로드를 처리할 때 발생하는 **Body 파편화 현상**.

서버가 수신한 데이터가 정상 JSON이 아닌 두 가지 형태로 파괴되어 전달됨:
- **바이트 인덱스 객체**: `{ 0: "{", 1: "\"", 2: "e" ... }`
- **과학적 표기법 숫자**: `1.2334e+129`

**해결책 — Body Recovery 미들웨어**

```javascript
app.use((req, res, next) => {
    const recover = (data) => {
        try {
            if (!data) return null;
            if (typeof data === 'string') return JSON.parse(data);
            if (Buffer.isBuffer(data)) return JSON.parse(data.toString('utf8'));
            if (typeof data === 'object') {
                const keys = Object.keys(data);
                if (keys.length > 0 && keys.every(k => !isNaN(k))) {
                    let raw = typeof data[0] === 'number'
                        ? Buffer.from(Object.values(data)).toString('utf8')
                        : Object.values(data).join('');
                    return JSON.parse(raw);
                }
            }
        } catch (e) {}
        return null;
    };

    if (!req.body || Object.keys(req.body).length === 0 || typeof req.body === 'number') {
        const eventBody = req.apiGateway?.event?.body;
        if (eventBody) {
            let decoded = eventBody;
            if (req.apiGateway?.event?.isBase64Encoded)
                decoded = Buffer.from(eventBody, 'base64').toString('utf8');
            const found = recover(decoded);
            if (found) req.body = found;
        }
    }
    const final = recover(req.body);
    if (final) req.body = final;
    next();
});
```

원인 파악 후 **단 2회 빌드만에 서비스 정상화** 성공.

---

### 자주 발생하는 오류

| 증상 | 원인 | 해결 |
|------|------|------|
| 로그인 시 400 에러 | Body Recovery 미들웨어 미적용 | `backend/functions/api.js` 최신 코드 배포 확인 |
| 새로고침 시 404 | SPA 리다이렉트 미설정 | `netlify.toml`의 `[[redirects]]` 설정 확인 |
| AI 분석 실패 | Gemini API 키 누락 또는 할당량 초과 | Netlify 환경변수 `GEMINI_API_KEY` 확인 |
| DB 연결 실패 | Supabase Pooler 포트 오류 | Connection String 포트를 **6543** (Transaction Pooler)으로 변경 |

---

## 프로젝트 회고

### 구현 성과

- AI(Gemini) 기반 건강검진 이미지 OCR 분석 및 리포트 생성 파이프라인 완성
- JWT 인증 + Supabase PostgreSQL 기반 풀스택 아키텍처 구현
- Netlify Serverless Functions로 백엔드·프론트엔드 단일 플랫폼 통합 배포
- GitHub Actions CI/CD 파이프라인 구축 (main 브랜치 Push 시 자동 빌드 검증)
- 반응형 UI — 모바일·태블릿·데스크톱 전 해상도 대응

### 기술적 배움

> **"결과(DB 조회 실패)에만 매몰되어 원인(입력 데이터 부재)을 간과한 '인과관계의 함정'"**

5시간에 걸친 디버깅 끝에 발견한 Serverless Body 파편화 문제는, 에러 메시지를 곧이곧대로 믿지 않고 **전송 단계의 원시 데이터(Raw Data)를 직접 확인**한 순간 해결되었습니다.

총 24회 빌드 / 330.2 Credits 소모 (무료 할당량 300 초과) 라는 값비싼 경험을 통해, **계층별 데이터 검증의 중요성**과 서버리스 환경의 특수성을 체득하였습니다.

### 향후 개선 사항

- 연도별 검진 이력 비교 기능 (현재 Mock 데이터)
- 검진 항목별 정상/주의/위험 기준 커스터마이징
- 푸시 알림 기반 건강 미션 리마인더

---

© 2026 CareLink Team. All Rights Reserved.
