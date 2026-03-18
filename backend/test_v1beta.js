const axios = require('axios');
require('dotenv').config();

const testV1Beta = async () => {
    const key = process.env.GEMINI_API_KEY;
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    try {
        const res = await axios.post(URL, {
            contents: [{ parts: [{ text: "Hello" }] }]
        });
        console.log("v1beta Success:", res.data.candidates[0].content.parts[0].text);
    } catch (err) {
        console.error("v1beta Failed status:", err.response?.status);
        console.error("v1beta Failed body:", JSON.stringify(err.response?.data, null, 2));
    }
};

testV1Beta();
