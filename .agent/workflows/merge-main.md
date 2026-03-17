---
description: 4번 사용자의 규칙에 따라 main 브랜치로 병합하는 방법
---
1. 현재 작업 중인 브랜치에서 모든 내용을 커밋하고 push했는지 확인한다.
2. `git checkout main`으로 이동한다.
3. `git pull origin main`으로 최신 상태를 유지한다.
4. 다음 형식의 메시지를 사용하여 병합한다: `git merge --no-ff -m "4.[순차번호]: [병합 내용 요약]" [작업용-브랜치-이름]`
   - 예: `git merge --no-ff -m "4.3: 마이페이지 작업 병합" 4.Mypage`
5. `git push origin main`으로 전송한다.
