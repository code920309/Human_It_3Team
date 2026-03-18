const axios = require('axios');
require('dotenv').config();

async function testQuota() {
    const key = process.env.GEMINI_API_KEY;
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];
    
    for (const m of models) {
        const URL = `https://generativelanguage.googleapis.com/v1/models/${m}:generateContent?key=${key}`;
        try {
            console.log(`Testing ${m}...`);
            const res = await axios.post(URL, {
                contents: [{ parts: [{ text: "Hi" }] }]
            });
            console.log(`Success! ${m}:`, res.data.candidates[0].content.parts[0].text);
            return;
        } catch (err) {
            console.log(`Failed ${m}:`, err.response?.data?.error?.message || err.message);
        }
    }
}
testQuota();
