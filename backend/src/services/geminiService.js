const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

/**
 * API 키 분산 관리 시스템
 * 
 * 원리:
 * - 환경변수에서 쉼표로 구분된 여러 Gemini API 키를 읽음
 * - 매 요청마다 다음 API 키로 순환 전환
 * - 각 키의 월별 토큰 할당량을 분산 사용
 * 
 * 예: 3개 키 = 할당량 3배 증가 (45,000 TPM)
 */

// 환경변수에서 API 키 배열 파싱
const apiKeysString = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
const apiKeys = apiKeysString.split(',').map(key => key.trim()).filter(key => key.length > 0);

if (apiKeys.length === 0) {
    throw new Error('❌ GEMINI_API_KEYS 또는 GEMINI_API_KEY가 설정되어 있지 않습니다.');
}

console.log(`✅ Gemini API 키 ${apiKeys.length}개 로드됨 (토큰 할당량 ${apiKeys.length}배)`);

// 현재 사용할 API 키의 인덱스 (0부터 시작)
let currentKeyIndex = 0;

/**
 * 다음 API 키를 반환하고 인덱스 업데이트
 * 순환: 0 → 1 → 2 → 0 → 1 → 2 ...
 */
function getNextGenAI() {
    const apiKey = apiKeys[currentKeyIndex];
    const keyPreview = apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5);
    
    console.log(`🔄 API 키 사용: ${keyPreview} (${currentKeyIndex + 1}/${apiKeys.length})`);
    
    // 다음 요청을 위해 인덱스 증가 (순환)
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    
    return new GoogleGenerativeAI(apiKey);
}

// Helper to handle both file path (local) and buffer (serverless)
function fileToGenerativePart(path, buffer, mimeType) {
  const data = path ? fs.readFileSync(path) : buffer;
  return {
    inlineData: {
      data: Buffer.from(data).toString("base64"),
      mimeType
    },
  };
}

exports.analyzeHealthReport = async (fileData, mimeType, userInfo) => {
    // 다음 API 키로 Gemini 클라이언트 생성
    const genAI = getNextGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // fileData can be a path (string) or a buffer
    const isPath = typeof fileData === 'string';
    const filePath = isPath ? fileData : null;
    const fileBuffer = isPath ? null : fileData;

    const prompt = `
너는 CareLink의 AI 건강 분석 엔진이다.
사용자가 업로드한 건강검진 결과지 이미지를 분석하여 주요 건강 지표를 추출하고 분석 보고서를 작성하라.

사용자 정보:
- 나이: ${userInfo.age || '알 수 없음'}
- 성별: ${userInfo.gender === 'M' ? '남성' : '여성'}

추출 및 분석 지침:
1. 다음 지표들을 찾아 수치들을 추출하라:
   - waist (허리둘레, cm)
   - bpSys (수축기 혈압, mmHg)
   - bpDia (이완기 혈압, mmHg)
   - glucose (공복혈당, mg/dL)
   - tg (중성지방, mg/dL)
   - hdl (HDL 콜레스테롤, mg/dL)
   - ldl (LDL 콜레스테롤, mg/dL)
   - ast, alt, gammaGtp (간 기능 수치)
   - bmi (체질량지수)

2. 추출된 데이터를 바탕으로 다음 JSON 형식으로 응답하라 (JSON 외의 텍스트는 포함하지 말 것):
{
  "healthRecord": {
    "waist": number,
    "bpSys": number,
    "bpDia": number,
    "glucose": number,
    "tg": number,
    "hdl": number,
    "ldl": number,
    "ast": number,
    "alt": number,
    "gammaGtp": number,
    "bmi": number
  },
  "aiReport": {
    "summary": "2~4문장 한국어 요약",
    "medicalRecommendation": "1~2문장 의료 권고",
    "riskOverview": ["위험요인1", "위험요인2"],
    "organStatus": {
      "heart": "normal | borderline | risk",
      "liver": "normal | borderline | risk",
      "pancreas": "normal | borderline | risk",
      "abdomen": "normal | borderline | risk",
      "vessels": "normal | borderline | risk"
    },
    "healthScore": 0~100 사이의 점수
  }
}

추출할 수 없는 수치는 null로 표시하라.
결과는 반드시 유효한 JSON 형식이어야 한다.
`;

    const imagePart = fileToGenerativePart(filePath, fileBuffer, mimeType);

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response if it's wrapped in code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    throw new Error('AI 분석 결과를 파싱할 수 없습니다.');
};

exports.chatHealthConsultation = async (history, message, healthContext) => {
    // 다음 API 키로 Gemini 클라이언트 생성
    const genAI = getNextGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const contextPrompt = `
너는 CareLink의 전문 건강 상담 AI다. 
사용자의 건강검진 데이터를 기반으로 친절하고 전문적인 의학적 조언을 제공하라.

사용자의 현재 건강 상태 (최신 데이터):
- 허리둘레: ${healthContext.waist}cm
- 혈압: ${healthContext.blood_pressure_s}/${healthContext.blood_pressure_d}mmHg
- 공복혈당: ${healthContext.fasting_glucose}mg/dL
- 콜레스테롤: HDL ${healthContext.hdl}, LDL ${healthContext.ldl}, TG ${healthContext.tg}
- 간 수치: AST ${healthContext.ast}, ALT ${healthContext.alt}, γ-GTP ${healthContext.gamma_gtp}
- BMI: ${healthContext.bmi}
- 종합 점수: ${healthContext.health_score}점

상담 원칙:
1. 항상 따뜻하고 격려하는 말투를 사용하라.
2. 사용자의 구체적인 수치를 언급하며 조언하라.
3. 심각한 수치가 있다면 반드시 병원 방문을 권고하라.
4. 답변은 한국어로 하라.
`;

    const chat = model.startChat({
        history: history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
        })),
        systemInstruction: contextPrompt
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
};

exports.generateActionPlan = async (healthContext) => {
    // 다음 API 키로 Gemini 클라이언트 생성
    const genAI = getNextGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
사용자의 건강검진 데이터를 기반으로 다음 일주일 동안 실천할 구체적인 '액션 플랜(Action Plan)' 3가지를 생성하라.

사용자 데이터:
- 혈압: ${healthContext.blood_pressure_s}/${healthContext.blood_pressure_d}
- 혈당: ${healthContext.fasting_glucose}
- BMI: ${healthContext.bmi}
- 요약: ${healthContext.summary}

생성 지침:
1. 식단(diet), 운동(exercise), 생활습관(lifestyle) 카테고리별로 하나씩 생성하라.
2. 구체적이고 실천 가능한 목표여야 한다.
3. 다음 JSON 형식으로 응답하라:
{
  "plans": [
    {
      "category": "diet | exercise | lifestyle",
      "title": "한 줄 제목",
      "content": "상세 실천 내용",
      "difficulty": "easy | medium | hard"
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { plans: [] };
};
