# CareLink 배포 및 협업 가이드 (Netlify + Supabase)

이 문서는 팀원들이 CareLink 프로젝트의 배포 구조를 이해하고, 새로운 환경에서 배포를 설정할 때 참고할 수 있도록 작성되었습니다.

---

## 🏗 프로젝트 구조 및 빌드 방식
우리 프로젝트는 백엔드와 프론트엔드가 분리된 모노레포(Monorepo) 스타일의 구조를 가지고 있습니다.

- **`/backend`**: Express 서버 코드 (Netlify Functions로 배포)
- **`/frontend`**: React(Vite) 클라이언트 코드 (Netlify Static Hosting으로 배포)

---

## 🚀 배포 단계별 가이드

### 1. 데이터베이스 설정 (Supabase)
1. [Supabase](https://supabase.com/)에서 프로젝트를 생성합니다.
2. **Project Settings > Database**에서 **Connection String (URI)**를 복사합니다.
   - **중요**: IPv4 환경 호환성을 위해 **Pooler 주소 (포트 6543)** 사용을 권장합니다.

### 2. Netlify 배포 설정
1. GitHub 리포지토리를 연결하고 다음 환경 변수를 등록합니다.

| 변수명 | 설명 | 예시값 |
| :--- | :--- | :--- |
| `DATABASE_URL` | Supabase Connection URI | `postgres://...pooler.supabase.com:6543/...` |
| `GEMINI_API_KEY` | Google AI API 키 | `AIzaSy...` |
| `JWT_SECRET` | 인증 토큰용 비밀키 | `any-random-string` |
| `VITE_API_URL` | 프론트엔드 API 경로 | `/.netlify/functions/api` |

---

## 🏗️ 데이터베이스 초기화 및 데이터 준비

새로운 Supabase 환경을 세팅한 후에는 반드시 아래 명령어를 통해 테이블을 생성하고 테스트 정보를 넣어주어야 합니다.

1. **테이블 생성 (최초 1회)**
   ```bash
   # backend 폴더에서 실행
   node src/init_db.js
   ```

2. **테스트 데이터 넣기 (선택 사항)**
   ```bash
   # test@test.com 계정 및 샘플 리포트 생성
   node src/seed.js
   ```

---

## 🛠 주요 트러블슈팅

### 1. 배포 에러: `package.json`을 찾을 수 없음
**원인**: Netlify가 루트 폴더에서 `npm run build`를 실행하려고 함.
**해결**: `netlify.toml`의 build command를 `cd frontend && ...` 형태로 수정함.

### 2. DB 연결 에러: `ENOTFOUND`
**원인**: 수파베이스의 IPv6 주소를 IPv4 환경에서 찾지 못함.
**해결**: 주소 형식을 `pooler.supabase.com:6543`으로 교체.

### 3. 로그인 에러: `가입되지 않은 이메일 (입력길이: 0)`
**원인**: Netlify Functions 환경에서 클라이언트 JSON 데이터가 파싱되지 않고 유실됨.
**해결**: `app.js`에 서버리스 전용 Body Parser Fallback 로직을 추가하고 Axios의 `Content-Type`을 명시함.

---
© 2026 CareLink Dev Team
