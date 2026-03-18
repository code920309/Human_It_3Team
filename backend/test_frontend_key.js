const axios = require('axios');

async function testKey() {
    const key = "AIzaSyDruP-saVC2HYGZSY2rwcB9ZUaifbiyO4w"; // Frontend key
    const URL = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;
    try {
        const res = await axios.get(URL);
        console.log("Frontend Key Success! Models count:", res.data.models.length);
    } catch (err) {
        console.error("Frontend Key Failed:", err.response?.data || err.message);
    }
}
testKey();
