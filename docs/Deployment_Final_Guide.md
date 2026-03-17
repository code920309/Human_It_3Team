# 🚀 CareLink 배포 가이드 (최종본)

본 가이드는 새 계정 배포나 협업 시 누구나 동일한 환경을 구축할 수 있도록 정리된 최종 버전입니다.

## 1. 환경 변수 (Environment Variables) 설정
Netlify Site configuration > Environment variables에 아래 값을 먼저 설정해야 합니다.

| key | 설명 | 예시 |
| :--- | :--- | :--- |
| DATABASE_URL | Supabase 커넥션 스트링 | postgres://postgres.xxx:pw@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres |
| JWT_SECRET | 토큰 암호화 키 | 아무_긴_문자열 |
| GEMINI_API_KEY | 구글 제미나이 API 키 | AIza... |
| VITE_API_URL | (선택) API 엔드포인트 | /api 또는 빈값 (자동 설정됨) |

> 중요: Supabase 연결 시 포트 6543을 사용하는 Pooler 주소를 권장합니다.

## 2. 데이터베이스 초기화 (DB Setup)
리포지토리를 클론한 후, 로컬에서 한 번만 아래 명령어를 실행하여 테이블과 데이터를 생성합니다.

```bash
cd backend
npm install
node src/init_db.js    # 테이블 생성 (PostgreSQL 스키마 자동 적용)
node src/seed.js       # 테스트 유저 및 샘플 데이터 주입
```

## 3. Netlify 배포 설정
netlify.toml에 이미 모든 설정이 포함되어 있으나, 대시보드에서 다음을 확인하세요.
- Build command: npm install && cd frontend && npm install && npm run build
- Publish directory: frontend/dist
- Functions directory: backend/functions

## 4. 테스트 계정 정보
- 이메일: test@test.com
- 비밀번호: password123

## 5. 자주 발생하는 이슈 해결 (Q&A)
- 로그인 시 400 에러: Lock to stop auto publishing을 끄고 최신 코드가 배포되었는지 확인하세요. (바디 복구 미들웨어가 필요함)
- 새로고침 시 404: public/_redirects 파일이 정상적으로 빌드 폴더에 포함되었는지 확인하세요.
- AI 분석 실패: GEMINI_API_KEY 환경 변수가 누락되었거나 무료 플랜 할당량이 초과되었는지 확인하세요.

---
최종 작성일: 2026-03-16
