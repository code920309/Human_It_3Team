const dotenv = require('dotenv');
const path = require('path');

/* 
 * [최적화] 환경 변수 관리 매니저 (Env Manager) 
 * 대표님, 이 파일은 서버 실행 시 필수 설정값들이 있는지 검사하고, 
 * 누락되었을 경우 친절하게 에러를 출력하여 문제 원인을 빠르게 파악할 수 있게 돕습니다.
 */

// .env 파일 로드
dotenv.config();

const requiredEnvVars = [
    'PORT',
    'DATABASE_URL',
    'JWT_SECRET',
    'GEMINI_API_KEY'
];

/**
 * 필수 환경 변수가 있는지 검사하는 함수
 */
const validateEnv = () => {
    const missingVars = [];
    
    requiredEnvVars.forEach(key => {
        if (!process.env[key]) {
            missingVars.push(key);
        }
    });

    if (missingVars.length > 0) {
        console.error('====================================================');
        console.error('🚨 [환경변수 설정 에러] 필수 설정값이 누락되었습니다!');
        console.error('누락된 항목:', missingVars.join(', '));
        console.error('----------------------------------------------------');
        console.error('👉 .env 파일 혹은 서버 설정(Heroku/Netlify 등)을 확인해 주세요.');
        console.error('====================================================');
        
        // 크리티컬한 변수가 없으면 서버를 종료하지 않고 경고만 띄우되, 
        // 서비스 동작에 지장이 있을 수 있음을 알립니다.
        return false;
    }
    
    console.log('✅ 모든 필수 환경변수가 정상적으로 로드되었습니다.');
    return true;
};

// 즉시 검사 실행
validateEnv();

module.exports = {
    PORT: process.env.PORT || 5000,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET || 'carelink_default_secret',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    // (선택) 여러 개의 API 키가 있을 경우 배열로 변환
    GEMINI_API_KEYS: process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',') : [process.env.GEMINI_API_KEY]
};
