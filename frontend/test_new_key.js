const axios = require('axios');

async function testKey() {
    const key = process.env.VITE_GEMINI_API_KEY || "AIzaSyB85A47vB0Grl8B3lU-doep0IPDKOwq9FY"; 
    const URL = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;
    try {
        const res = await axios.get(URL);
        console.log("Frontend Key Success! Models count:", res.data.models.length);
        console.log("Available models:", res.data.models.map(m => m.name).slice(0, 10));
    } catch (err) {
        console.error("Frontend Key Failed:", err.response?.data || err.message);
    }
}
testKey();
