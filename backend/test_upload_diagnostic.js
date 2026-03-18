const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

async function runTest() {
    try {
        // 1. Create a dummy PDF
        const pdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n188\n%%EOF';
        fs.writeFileSync('diagnostic_test.pdf', pdfContent);

        // 2. Login to get token
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@test.com',
            password: 'password123',
            loginOption: 'none'
        });
        const token = loginRes.data.accessToken;
        console.log('Logged in successfully.');

        // 3. Prepare upload request
        const form = new FormData();
        form.append('reportFile', fs.createReadStream('diagnostic_test.pdf'));
        form.append('year', '2025');

        console.log('Sending upload request...');
        const uploadRes = await axios.post('http://localhost:5000/api/reports/upload', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Upload success:', uploadRes.data);
    } catch (err) {
        console.error('--- Test Failed ---');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('Error Message:', err.message);
        }
    } finally {
        if (fs.existsSync('diagnostic_test.pdf')) fs.unlinkSync('diagnostic_test.pdf');
    }
}

runTest();
