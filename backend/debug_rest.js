const axios = require('axios');
require('dotenv').config();

async function callGeminiREST(message, history = [], systemInstruction = "") {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    // Try v1 instead of v1beta if v1beta is failing
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const contents = history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(h.content || h.message || '') }]
    }));

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
        return response.data;
    } catch (err) {
        console.error("Gemini REST API Error:", JSON.stringify(err.response?.data, null, 2) || err.message);
        throw err;
    }
}

callGeminiREST("Hello! Who are you?", [], "You are a helpful assistant.")
    .then(data => console.log("Success:", JSON.stringify(data, null, 2)))
    .catch(err => console.log("Failed"));
