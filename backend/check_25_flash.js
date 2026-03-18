const axios = require('axios');
require('dotenv').config();

async function check25() {
    const key = process.env.GEMINI_API_KEY;
    const URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${key}`;
    try {
        const res = await axios.post(URL, {
            contents: [{ parts: [{ text: "Are you online?" }] }]
        });
        console.log("Gemini 2.5 Flash Online:", res.data.candidates[0].content.parts[0].text);
    } catch (err) {
        console.error("Gemini 2.5 Flash Offline:", err.response?.data || err.message);
    }
}
check25();
