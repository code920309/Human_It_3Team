const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

const testApi = async () => {
    try {
        const response = await axios.get(URL);
        console.log("Available Models:", response.data.models.map(m => m.name));
    } catch (err) {
        console.error("Error Body:", JSON.stringify(err.response?.data, null, 2));
    }
};

testApi();
