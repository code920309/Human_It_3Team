const axios = require('axios');
require('dotenv').config();

async function testREST() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    
    for (const model of models) {
        const URL = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        try {
            console.log(`Trying ${model} at ${URL}...`);
            const response = await axios.post(URL, {
                contents: [{ parts: [{ text: "Hello" }] }]
            });
            console.log(`Success! [${model}] Response:`, response.data.candidates[0].content.parts[0].text);
            return;
        } catch (err) {
            console.log(`Failed [${model}]:`, err.response?.data?.error?.message || err.message);
        }
    }
}
testREST();
