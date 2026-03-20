import os
from dotenv import load_dotenv

# dotenv_path를 명시적으로 지정
load_dotenv(dotenv_path='./backend/.env')
key = os.getenv("GEMINI_API_KEY")

if key:
    print(f"키 로드 성공: {key[:5]}***") # 보안을 위해 앞부분만 출력
else:
    print("키 로드 실패: .env 파일을 찾지 못했거나 변수명이 다릅니다.")
