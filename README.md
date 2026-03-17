# CareLink - AI 기반 건강검진 분석 플랫폼

> **🚨 알림: 현재 배포 환경 이슈 (2026-03-16)**
> 현재 Netlify 배포 서버가 클라이언트 데이터를 수신하지 못하는 이슈(Body 유실)가 발견되었습니다. 자세한 분석 내용과 대응 방안은 [배포 상태 리포트](docs/Deployment_Status_Report.md)를 참고해주세요. (로컬 환경에서는 정상 작동합니다.)

CareLink는 복잡한 건강검진 결과를 AI(Gemini)를 통해 쉽게 분석하고, 개인화된 건강 관리 액션 플랜과 AI 상담을 제공하는 플랫폼입니다.

## 🚀 주요 기능

- **AI 건강검진 분석**: 결과지 이미지(OCR) 또는 수동 입력을 통해 AI가 정밀 분석 리포트를 생성합니다.
- **건강 대시보드**: 점수화된 건강 요약 및 추이 그래프를 한눈에 확인합니다.
- **맞춤형 액션 플랜**: 현재 상태에 최적화된 식단 및 운동 미션을 제공합니다.
- **AI 건강 상담**: 챗봇을 통해 자신의 건강 데이터에 기반한 1:1 상담을 받을 수 있습니다.
- **프리미엄 디자인**: Teal & Soft Beige 톤의 세련되고 신뢰감 있는 UI.

## 🛠 Tech Stack

- **Frontend**: React v18.3 (Vite v5.4), Tailwind CSS v3.4, Lucide-React v0.460, Recharts v3.8, Swiper.js v11.1, Framer Motion v12.3
- **Backend**: Node.js v20.18, Express v5.2, MySQL/PostgreSQL (Supabase), Gemini API v0.24, JWT v9.0
- **Deployment**: Netlify (Serverless Functions + Static Hosting)

## ⚙️ 설정 가이드 (Setup)

### 1. 로컬 환경 변수 설정
`backend/` 폴더 내에 `.env` 파일을 생성하세요.

```bash
# 로컬 MySQL 사용 시
PORT=5000
DB_HOST=localhost
DB_USER=your_user
DB_PASS=your_password
DB_NAME=carelink
JWT_SECRET=your_secret
GEMINI_API_KEY=your_key
```

### 2. 배포 설정 (Supabase & Netlify)

#### **Step 1: 데이터베이스 (Supabase)**
1. Supabase 프로젝트 생성 후 **SQL Editor**로 이동합니다.
2. `backend/src/config/supabase_init.sql`의 내용을 복사하여 실행합니다.
3. 프로젝트 설정의 **Connection String (URI)**를 복사해둡니다.

#### **Step 2: 백엔드/프론트엔드 (Netlify)**
1. Netlify 프로젝트 생성 후 GitHub 리포지토리를 연결합니다.
2. **Site Settings > Environment variables**에서 다음을 추가합니다:
   - `DATABASE_URL`: Supabase Connection URI
   - `JWT_SECRET`: 랜덤한 보안 키
   - `GEMINI_API_KEY`: 제미나이 API 키
   - `VITE_API_URL`: `/.netlify/functions/api` (프론트엔드 호출용)

---
© 2026 CareLink Team. All Rights Reserved.

### 2. 백엔드 실행

```bash
cd backend
npm install
npm run dev (npm ruu dev 안될경우 -> node src/app.js)
```

### 3. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

---
© 2026 CareLink Team. All Rights Reserved.
