const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const response = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).listModels();
        // Wait, listModels is not on the model instance, it's on a different service or something.
        // In the new SDK, it's not directly accessible like this.
        console.log('Fetching models via REST because SDK is sometimes finicky...');
        const axios = require('axios');
        const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        console.log('Available Models:', res.data.models.map(m => m.name));
    } catch (err) {
        console.error('Error listing models:', err.response?.data || err.message);
    }
}

listModels();
