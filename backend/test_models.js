const axios = require('axios');

async function testKey() {
    const key = "AIzaSyB85A47vB0Grl8B3lU-doep0IPDKOwq9FY"; 
    const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    try {
        const res = await axios.get(URL);
        const models = res.data.models.map(m => m.name.replace('models/', ''));
        console.log("All gemini models:", models.filter(m => m.includes('gemini')).join(', '));
    } catch (err) {
        console.error("Frontend Key Failed:", err.response?.data || err.message);
    }
}
testKey();
