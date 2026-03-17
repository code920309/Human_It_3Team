const axios = require('axios');

async function testSignup() {
  try {
    console.log('Testing OTP request...');
    const otpRes = await axios.post('http://localhost:5000/api/auth/signup/request-otp', {
      email: 'test_auto@example.com'
    });
    console.log('OTP Result:', otpRes.data);

    // Get OTP from console log simulation (we can't read it easily but we can check if it inserted into DB)
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

testSignup();
