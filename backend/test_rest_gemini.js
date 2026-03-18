const axios = require('axios');
require('dotenv').config();

async function testREST() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const body = {
        contents: [
            {
                parts: [
                    { text: "안녕, 너는 누구니?" }
                ]
            }
        ]
    };

    try {
        console.log(`Sending to ${URL}...`);
        const response = await axios.post(URL, body);
        console.log("Success! Response text:", response.data.candidates[0].content.parts[0].text);
        process.exit(0);
    } catch (err) {
        console.error("Error Response:", err.response?.data || err.message);
        process.exit(1);
    }
}
testREST();
