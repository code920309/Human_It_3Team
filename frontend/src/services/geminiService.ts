import { GoogleGenAI, Type } from "@google/genai";
import { HealthReport, ChatMessage, User } from "../types";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey });
};

export const analyzeHealthCheckup = async (
  fileData: string,
  mimeType: string,
  user: User,
  lang: string = 'ko'
): Promise<HealthReport> => {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  
  const languageName = lang === 'ko' ? 'Korean' : 'English';
  
  const prompt = `
    Analyze this health checkup result for a ${user.age}-year-old ${user.gender} named ${user.name}.
    
    CRITICAL LANGUAGE INSTRUCTION:
    The user's current language setting is ${languageName}. 
    You MUST provide ALL text outputs (summary, metric names, reference ranges, action plan items, medical advice) in ${languageName} ONLY.
    DO NOT use Korean in the output if the requested language is English.
    
    Specific Translation Requirements for English:
    - "공복혈당" -> "Fasting Blood Sugar"
    - "총콜레스테롤" -> "Total Cholesterol"
    - "중성지방" -> "Triglycerides"
    - "수축기 혈압" -> "Systolic Blood Pressure"
    - "이완기 혈압" -> "Diastolic Blood Pressure"
    - "체질량지수" -> "BMI"
    - And all other medical terms must be translated to standard English medical terminology.

    1. Extract key metrics from the provided image.
    2. For each metric, provide the reference range. 
    3. Determine the status (normal, caution, danger).
    4. Provide a health score (0-100), a summary, and a detailed action plan.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { inlineData: { data: fileData.split(',')[1], mimeType } },
          { text: prompt }
        ]
      }
    ],
    config: {
      systemInstruction: `You are a professional medical translator and analyzer. Your task is to extract data from health reports and present it EXCLUSIVELY in ${languageName}. Even if the source document is in another language, the output JSON must contain only ${languageName} text.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          metrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                referenceRange: { type: Type.STRING },
                status: { type: Type.STRING, description: "one of: normal, caution, danger" }
              },
              required: ["name", "value", "unit", "referenceRange", "status"]
            }
          },
          actionPlan: {
            type: Type.OBJECT,
            properties: {
              diet: { type: Type.ARRAY, items: { type: Type.STRING } },
              exercise: { type: Type.ARRAY, items: { type: Type.STRING } },
              lifestyle: { type: Type.ARRAY, items: { type: Type.STRING } },
              medicalAdvice: { type: Type.STRING }
            },
            required: ["diet", "exercise", "lifestyle"]
          }
        },
        required: ["score", "summary", "metrics", "actionPlan"]
      }
    }
  });

  const result = JSON.parse(response.text || "{}");
  return {
    id: Math.random().toString(36).substr(2, 9),
    date: new Date().toISOString().split('T')[0],
    lang: lang as 'ko' | 'en',
    ...result
  };
};

export const reanalyzeHealthMetrics = async (
  metrics: any[],
  user: User,
  lang: string = 'ko'
): Promise<Partial<HealthReport>> => {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  
  const languageName = lang === 'ko' ? 'Korean' : 'English';
  
  const prompt = `
    Based on the following manually entered or corrected health metrics for a ${user.age}-year-old ${user.gender} named ${user.name}, 
    provide an updated health analysis.
    
    CRITICAL LANGUAGE INSTRUCTION:
    The user's current language setting is ${languageName}. 
    You MUST provide ALL text outputs (summary, metric names, reference ranges, action plan items, medical advice) in ${languageName} ONLY.
    DO NOT use Korean in the output if the requested language is English.
    
    Specific Translation Requirements for English:
    - Translate all Korean metric names to standard English medical terminology.

    Metrics:
    ${metrics.map(m => `- ${m.name}: ${m.value} ${m.unit} (Reference: ${m.referenceRange})`).join('\n')}
    
    Provide:
    1. An updated health score (0-100).
    2. A new summary.
    3. A detailed action plan (diet, exercise, lifestyle, medical advice).
    4. Ensure the status (normal, caution, danger) for each metric is correctly evaluated.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: `You are a professional medical translator and analyzer. Your task is to update health analysis based on provided metrics and present it EXCLUSIVELY in ${languageName}. Even if the input metrics have names in another language, the output JSON must contain only ${languageName} text.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          metrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                referenceRange: { type: Type.STRING },
                status: { type: Type.STRING }
              },
              required: ["name", "value", "unit", "referenceRange", "status"]
            }
          },
          actionPlan: {
            type: Type.OBJECT,
            properties: {
              diet: { type: Type.ARRAY, items: { type: Type.STRING } },
              exercise: { type: Type.ARRAY, items: { type: Type.STRING } },
              lifestyle: { type: Type.ARRAY, items: { type: Type.STRING } },
              medicalAdvice: { type: Type.STRING }
            },
            required: ["diet", "exercise", "lifestyle"]
          }
        },
        required: ["score", "summary", "metrics", "actionPlan"]
      }
    }
  });

  const result = JSON.parse(response.text || "{}");
  return {
    ...result,
    lang: lang as 'ko' | 'en'
  };
};

export const translateReport = async (
  report: HealthReport,
  targetLang: string
): Promise<HealthReport> => {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  const languageName = targetLang === 'ko' ? 'Korean' : 'English';

  const prompt = `
    Translate the following health report into ${languageName}.
    
    CRITICAL: You MUST provide ALL text outputs in ${languageName} ONLY.
    
    Report Data:
    - Summary: ${report.summary}
    - Metric Names: ${report.metrics.map(m => m.name).join(', ')}
    - Reference Ranges: ${report.metrics.map(m => m.referenceRange).join(', ')}
    - Action Plan Diet: ${report.actionPlan.diet.join(', ')}
    - Action Plan Exercise: ${report.actionPlan.exercise.join(', ')}
    - Action Plan Lifestyle: ${report.actionPlan.lifestyle.join(', ')}
    - Medical Advice: ${report.actionPlan.medicalAdvice || ''}

    Return the translated data in the same JSON structure.
    Ensure metric names are translated to standard medical terminology in ${languageName}.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: `You are a professional medical translator. Translate the provided health report data into ${languageName} EXCLUSIVELY.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          metrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                referenceRange: { type: Type.STRING }
              },
              required: ["name", "referenceRange"]
            }
          },
          actionPlan: {
            type: Type.OBJECT,
            properties: {
              diet: { type: Type.ARRAY, items: { type: Type.STRING } },
              exercise: { type: Type.ARRAY, items: { type: Type.STRING } },
              lifestyle: { type: Type.ARRAY, items: { type: Type.STRING } },
              medicalAdvice: { type: Type.STRING }
            },
            required: ["diet", "exercise", "lifestyle"]
          }
        },
        required: ["summary", "metrics", "actionPlan"]
      }
    }
  });

  const translated = JSON.parse(response.text || "{}");
  
  return {
    ...report,
    summary: translated.summary,
    lang: targetLang as 'ko' | 'en',
    metrics: report.metrics.map((m, i) => ({
      ...m,
      name: translated.metrics[i]?.name || m.name,
      referenceRange: translated.metrics[i]?.referenceRange || m.referenceRange
    })),
    actionPlan: translated.actionPlan
  };
};

export const getChatResponse = async (
  history: ChatMessage[],
  user: User,
  lang: string = 'ko',
  latestReport?: HealthReport
): Promise<string> => {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  
  const languageName = lang === 'ko' ? 'Korean' : 'English';
  
  const systemInstruction = `
    You are CareLink AI, a friendly health assistant. 
    User Profile: ${user.name}, ${user.age} years old, ${user.gender}.
    ${latestReport ? `Latest Health Report: Score ${latestReport.score}, Summary: ${latestReport.summary}` : "No health report uploaded yet."}
    
    CRITICAL: You MUST always respond in ${languageName}.
    
    Be encouraging and helpful. 
    If asked about specific medical conditions, always advise consulting a professional doctor.
  `;

  const chat = ai.chats.create({
    model,
    config: { systemInstruction }
  });

  // Convert history to Gemini format
  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  const lastMessage = contents.pop();
  
  const response = await chat.sendMessage({
    message: lastMessage?.parts[0].text || ""
  });

  const errorMsg = lang === 'ko' ? "죄송합니다. 답변을 생성하는 데 문제가 발생했습니다." : "Sorry, I encountered an error generating a response.";
  return response.text || errorMsg;
};
