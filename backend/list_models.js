const axios = require('axios');
require('dotenv').config();

async function listModels() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const URL = `https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`;
    
    try {
        console.log(`Listing models from ${URL}...`);
        const response = await axios.get(URL);
        console.log("Models:", JSON.stringify(response.data.models, null, 2));
    } catch (err) {
        console.error("Error Listing:", err.response?.data || err.message);
    }
}
listModels();
