const axios = require('axios');

async function testIndexedBody() {
    console.log('--- Testing Indexed Body Reconstruction ---');
    
    // Simulate the weird indexed object that happens in serverless
    // {"email":"test@test.com","password":"password123"}
    const rawJson = JSON.stringify({ email: "test@test.com", password: "password123" });
    const indexedBody = {};
    for (let i = 0; i < rawJson.length; i++) {
        indexedBody[i] = rawJson[i];
    }

    console.log('Sending indexed body (keys 0 to ' + (rawJson.length - 1) + ')...');

    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', indexedBody, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('Response Success:', response.data.success);
        if (response.data.token) console.log('Login Successful! Token received.');
    } catch (error) {
        console.error('Response Error:', error.response ? error.response.data : error.message);
    }
}

testIndexedBody();
