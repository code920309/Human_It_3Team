# CareLink - AI 기반 건강검진 분석 플랫폼

CareLink는 복잡한 건강검진 결과를 AI(Gemini)를 통해 쉽게 분석하고, 개인화된 건강 관리 액션 플랜과 AI 상담을 제공하는 플랫폼입니다.

## 🚀 주요 기능

- **AI 건강검진 분석**: 결과지 이미지(OCR) 또는 수동 입력을 통해 AI가 정밀 분석 리포트를 생성합니다.
- **건강 대시보드**: 점수화된 건강 요약 및 추이 그래프를 한눈에 확인합니다.
- **맞춤형 액션 플랜**: 현재 상태에 최적화된 식단 및 운동 미션을 제공합니다.
- **AI 건강 상담**: 챗봇을 통해 자신의 건강 데이터에 기반한 1:1 상담을 받을 수 있습니다.
- **프리미엄 디자인**: Teal & Soft Beige 톤의 세련되고 신뢰감 있는 UI.

## 🛠 Tech Stack

- **Frontend**: React v18.3 (Vite v5.4), Tailwind CSS v3.4, Lucide-React v0.460, Recharts v3.8, Swiper.js v11.1, Framer Motion v12.3
- **Backend**: Node.js v20.18, Express v5.2, MySQL v3.19 (mysql2), Gemini API v0.24 (@google/generative-ai), JWT v9.0
- **Design Inspiration**: Google AI Studio Premium Design

## ⚙️ 설정 가이드 (Setup)

### 1. 환경 변수 설정

협업을 위해 `.env` 파일을 로컬에 생성해야 합니다. `backend/` 폴더 내의 `.env.example` 파일을 복사하여 `.env`를 만들고 실제 값을 입력하세요.

```bash
# backend/.env 예시
PORT=5000
DB_PORT=3306
DB_HOST=localhost
DB_USER=root
DB_PASS=설정한_비밀번호
DB_NAME=carelink
JWT_SECRET=랜덤한_비밀키
GEMINI_API_KEY=발급받은_제미나이_API_KEY
```

### 2. 백엔드 실행

```bash
cd backend
npm install
npm run dev
```

### 3. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

---
© 2026 CareLink Team. All Rights Reserved.
