# 🏥 CareLink: Technical Deployment & Troubleshooting Report

> "AI 건강 분석 플랫폼의 안정성을 위한 인프라 구축과 서버리스 장애 해결 과정"

## 1. 프로젝트 개요
- 플랫폼: CareLink (AI 기반 개인 건강 비서)
- 스택: React, Node.js (Express), Supabase (PostgreSQL), Gemini 1.5 Flash API
- 인프라: Netlify (Frontend & Serverless Functions)

---

## 2. 주요 기술적 과제와 해결 (Technical Challenges)

### 핵심 과제 #1: 인프라 호환성 및 DB 연결 최적화
- 문제: Supabase 연동 시 IPv6 기반 주소가 국내 특정 네트워크 환경에서 ENOTFOUND 에러 유발.
- 분석: 일반적인 클라이언트 환경은 IPv4 위주이나, 클라우드 DB는 IPv6를 기본으로 하는 경우 발생.
- 해결: Supabase의 Transaction Pooler(포트 6543)를 통해 IPv4 환경에서도 안정적인 연결이 가능하도록 전용 커넥션 스트링을 적용하고, pg 라이브러리를 통해 안정적인 커넥션 풀을 구현함.

### 핵심 과제 #2: Serverless 환경의 데이터 유실 및 변형 (Critical)
- 문제: Netlify 배포 후 로그인 시 클라이언트 데이터가 유실(0 바이트)되거나, 데이터가 거대한 숫자(1.233e+129)로 변형되어 400 에러 발생.
- 원인 분석:
  1. 데이터 조각화: Netlify Functions가 큰 JSON 바디를 받을 때 데이터를 인덱스 기반의 객체({0: "{", 1: "\""...})로 쪼개서 전달함.
  2. 잘못된 파싱: 일반적인 JSON.parse가 이 숫자 배열을 '과학적 표기법의 숫자'로 오인하여 데이터가 파괴됨.
- 해결 (The Break-through):
  - Custom Body Recovery Middleware 개발: 데이터가 숫자로 들어오든 바이트 배열로 들어오든 Buffer를 통해 아스키 코드를 직접 글자로 해독하는 로직 구현.
  - Fallback 로직: req.body가 깨질 경우 Netlify의 원시 이벤트(req.apiGateway.event.body)를 직접 긁어와 Base64 해독 과정을 거쳐 데이터를 100% 복구함.

---

## 3. 구현 결과 및 성과
- 안정성 확보: 인프라 종속적인 바디 파싱 이슈를 소프트웨어 레벨에서 해결하여 어떤 배포 환경에서도 작동하는 코드를 구축.
- 자동화: init_db.js와 seed.js를 통해 데이터베이스 스키마와 테스트용 데이터를 5초 내에 자동 구축할 수 있는 환경 마련.
- AI 연동: Gemini 1.5 Flash를 활용한 고효율 건강 리포트 분석 로직 완성.

---

## 4. 테스트 로그인 정보 (QA용)
서비스 기능을 즉시 확인하실 수 있는 테스트 계정입니다.

- URL: [실제 배포 주소]
- 테스터 ID: test@test.com
- 비밀번호: password123
- 확인 가능한 기능: 건강 점수 대시보드, 2024년 건강 리포트 상세, AI 챗봇 상담 내역 등

---
© 2026 CareLink 기술 개발팀
