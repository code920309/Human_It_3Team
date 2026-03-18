const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const fs = require('fs');
const env = require('../config/env');

/* ==========================================================
 *   🚀 [최적화] CareLink AI 건강 엔진 (Gemini Service)
 *   대표님, 이 파일은 토큰 소모를 줄이고 서비스 안정성을 
 *   극대화하기 위해 전면 개편되었습니다.
 * ========================================================== */

// 1. 전역 설정 (모델명 및 기본 구성)
const MODEL_NAME = "gemini-flash-latest"; // 할당량 문제가 있는 2.0 대신 1.5 기반의 가장 안정적인 최신 모델로 우회 (1.5 Flash 최신 버전)
let currentKeyIndex = 0;

/**
 * [트래픽 분산] 등록된 여러 API 키를 번갈아 가며 사용합니다.
 */
function getNextKey() {
  const apiKeys = env.GEMINI_API_KEYS;
  if (!apiKeys || apiKeys.length === 0) {
    throw new Error('❌ API 키 설정이 누락되었습니다. .env를 확인해 주세요.');
  }
  const key = apiKeys[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  return key;
}

/**
 * [SDK 인스턴스 생성]
 */
function getNextGenAI() {
  return new GoogleGenerativeAI(getNextKey());
}

/**
 * [무결성 JSON 추출 시스템]
 * AI 답변에 섞인 군더더기를 제거하고 순수 JSON 데이터만 추출합니다.
 */
function extractJSON(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return null;
  } catch (e) {
    console.error("❌ JSON 파싱 에러:", e.message);
    return null;
  }
}

/**
 * [스마트 재시도 시스템]
 * 에러 발생 시 지정된 횟수만큼 자동 재시도합니다. (지수 백오프 적용)
 */
async function withRetry(taskFn, maxAttempts = 3) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      return await taskFn();
    } catch (err) {
      attempt++;
      // 할당량 초과(429) 에러인 경우에만 5초, 10초씩 대기하며 재시도
      if (err.status === 429 && attempt < maxAttempts) {
        const delay = 5000 * attempt;
        console.warn(`⚠️ 할당량 초과. ${delay / 1000}초 후 자동 재시도... (${attempt}/${maxAttempts})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err; // 치명적인 에러는 즉시 상위로 전달
    }
  }
}

/**
 * [헬퍼] 이미지를 AI가 이해할 수 있는 데이터로 변환
 */
function fileToGenerativePart(path, buffer, mimeType) {
  const data = path ? fs.readFileSync(path) : buffer;
  return {
    inlineData: {
      data: Buffer.from(data).toString("base64"),
      mimeType
    },
  };
}

/**
 * ----------------------------------------------------------
 * 1. [건강검진 분석] 이미지 분석 및 리포트 생성
 *    (토큰 최적화: 프롬프트 압축 기법 적용)
 * ----------------------------------------------------------
 */
exports.analyzeHealthReport = async (fileData, mimeType, userInfo, lang = 'ko') => {
  return withRetry(async () => {
    const genAI = getNextGenAI();
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // 비표준 MIME 타입 처리
    let finalMimeType = (mimeType === 'application/haansoftpdf') ? 'application/pdf' : mimeType;
    const imagePart = fileToGenerativePart(typeof fileData === 'string' ? fileData : null, typeof fileData === 'string' ? null : fileData, finalMimeType);

    // [최적화] 프롬프트 압축 - 핵심 지시사항 위주로 정리하여 토큰 소모 최소화
    const isEn = lang === 'en';
    const systemPrompt = isEn
      ? `CareLink AI: Extract health data from image. User: ${userInfo.age}y, ${userInfo.gender}. Output JSON ONLY: {healthRecord: {waist,bpSys,bpDia,glucose,tg,hdl,ldl,ast,alt,gammaGtp,bmi}, aiReport: {summary,medicalRecommendation,riskOverview[],organStatus:{heart,liver,pancreas,abdomen,vessels},healthScore}}. Use null if missing.`
      : `CareLink AI: 건강검진 분석. 사용자: ${userInfo.age}세, ${userInfo.gender}. 반드시 JSON 형식으로만 응답: {healthRecord: {waist,bpSys,bpDia,glucose,tg,hdl,ldl,ast,alt,gammaGtp,bmi}, aiReport: {summary,medicalRecommendation,riskOverview[],organStatus:{heart,liver,pancreas,abdomen,vessels},healthScore}}. 수치 없으면 null 표시.`;

    const result = await model.generateContent([systemPrompt, imagePart]);
    const response = await result.response;
    const data = extractJSON(response.text());

    if (!data) throw new Error('AI 응답 데이터 구조가 부정확하여 분석에 실패했습니다.');
    return data;
  });
};

/**
 * ----------------------------------------------------------
 * 2. [건강 상담 챗봇] 이전 대화 맥락을 기반으로 상담 제공
 *    (트래픽 최적화: 대화 기록 슬라이딩 윈도우 적용)
 * ----------------------------------------------------------
 */
exports.chatHealthConsultation = async (history, message, healthContext) => {
  // [토큰 최적화] 최근 5개의 대화만 유지하여 토큰 낭비 방지 (슬라이딩 윈도우)
  const optimizedHistory = history.slice(-5).map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: String(h.content || h.message || '') }]
  }));

  const systemInstruction = `너는 전문 건강 상담 AI다. 사용자 상태: ${JSON.stringify(healthContext)}. 친절하게 전문적 의학 조언을 하되, 답변은 한국어로 하라.`;

  return withRetry(async () => {
    const genAI = getNextGenAI();
    const model = genAI.getGenerativeModel({ model: MODEL_NAME, systemInstruction });
    // 대화 히스토리와 함께 메시지 전송
    const chat = model.startChat({ history: optimizedHistory });
    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  });
};

/**
 * ----------------------------------------------------------
 * 3. [액션 플랜] 주간 맞춤 건강 실천 계획 생성
 * ----------------------------------------------------------
 */
exports.generateActionPlan = async (healthContext) => {
  const prompt = `Based on health data: ${JSON.stringify(healthContext)}, create a 3-item weekly action plan (diet, exercise, lifestyle). Return JSON ONLY: {plans: [{category, title, content, difficulty}]}.`;

  return withRetry(async () => {
    const genAI = getNextGenAI();
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const data = extractJSON(response.text());
    return data || { plans: [] };
  });
};
