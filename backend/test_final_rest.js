const axios = require('axios');
require('dotenv').config();

async function testREST() {
    const key = process.env.GEMINI_API_KEY;
    const URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${key}`;
    try {
        const res = await axios.post(URL, {
            contents: [{ parts: [{ text: "Hello" }] }]
        });
        console.log("REST Success:", res.data.candidates[0].content.parts[0].text);
    } catch (err) {
        console.error("REST Failed:", err.response?.data || err.message);
    }
}
testREST();
