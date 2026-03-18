const axios = require('axios');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Helper for direct REST call as requested by USER
async function callGeminiREST(message, history = [], systemInstruction = "") {
    const URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // Construct contents with system instruction if provided
    const contents = history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(h.content || h.message || '') }]
    }));

    // Add current user message
    contents.push({
        role: "user",
        parts: [{ text: message }]
    });

    const body = {
        contents,
        systemInstruction: systemInstruction ? {
            parts: [{ text: systemInstruction }]
        } : undefined
    };

    try {
        const response = await axios.post(URL, body);
        return response.data.candidates[0].content.parts[0].text;
    } catch (err) {
        console.error("Gemini REST API Error:", err.response?.data || err.message);
        throw err;
    }
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
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
    // 1. Prepare Enhanced System Instruction
    const systemInstruction = `너는 'CareLink'의 전문 건강 상담 AI 비서다. 
사용자의 건강검진 데이터를 기반으로 정밀하고 따뜻한 의학적 상담을 제공하라.

사용자 건강 프로필:
- 혈압: ${healthContext.blood_pressure_s}/${healthContext.blood_pressure_d} mmHg
- 혈당: ${healthContext.fasting_glucose} mg/dL
- 콜레스테롤: HDL ${healthContext.hdl}, LDL ${healthContext.ldl}, TG ${healthContext.tg}
- 간 수치: AST ${healthContext.ast}, ALT ${healthContext.alt}
- BMI: ${healthContext.bmi}
- 종합 건강 점수: ${healthContext.health_score}점

상담 규칙:
1. AI답게 논리적이고 풍부한 정보를 제공하라.
2. 사용자의 수치를 전문가처럼 분석하여 정상 범위와 비교 설명하라.
3. 구체적인 생활 습관 개선(식단, 운동)을 실천 가능하게 제안하라.
4. "본 상담은 참고용이며, 정확한 진단은 전문의와 상의하십시오" 문구를 포함하라.
5. 성격은 차분하고 지적이며 친절하게 유지하라.`;

    const modelNames = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];
    
    for (const modelName of modelNames) {
        try {
            console.log(`Trying Gemini model: ${modelName}`);
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                systemInstruction: systemInstruction 
            });

            // Format history for SDK
            const sdkHistory = history.map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: String(h.message || h.content || '') }]
            }));

            const firstUserIdx = sdkHistory.findIndex(h => h.role === 'user');
            const finalHistory = firstUserIdx !== -1 ? sdkHistory.slice(firstUserIdx) : [];

            const chat = model.startChat({ history: finalHistory });
            const result = await chat.sendMessage(message);
            const response = await result.response;
            const text = response.text();
            
            if (text) return text;
        } catch (error) {
            console.error(`Gemini Model ${modelName} failed:`, error.message);
            // Continue to next model
        }
    }

    throw new Error("모든 제미나이 모델 호출에 실패했습니다. API 키 또는 할당량을 확인해주세요.");
};

exports.generateActionPlan = async (healthContext) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
