const mysql = require('mysql2/promise');
require('dotenv').config({path: '.env'});
const bcrypt = require('bcryptjs');

async function setup() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    try {
        const [users] = await conn.query('SELECT * FROM users WHERE email = ?', ['test@test.com']);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        
        if (users.length === 0) {
            await conn.query(`
                INSERT INTO users (email, password_hash, name, birth_date, gender, email_verified)
                VALUES (?, ?, ?, ?, ?, ?)
            `, ['test@test.com', hashedPassword, 'Test User', '1990-01-01', 'M', 1]);
            console.log("Test user created: test@test.com / password123");
        } else {
            await conn.query(
                'UPDATE users SET password_hash = ?, email_verified = 1 WHERE email = ?',
                [hashedPassword, 'test@test.com']
            );
            console.log("Test user updated: test@test.com / password123 (verified)");
        }
        
        // Also insert a test report
        const [userIds] = await conn.query('SELECT id FROM users WHERE email = ?', ['test@test.com']);
        const userId = userIds[0].id;

        const year = 2024;
        const [existingData] = await conn.query('SELECT id FROM health_data WHERE user_id = ? AND exam_year = ?', [userId, year]);
        
        let healthDataId;
        if (existingData.length === 0) {
            const healthDataFields = {
                user_id: userId,
                exam_year: year,
                waist: 85.0,
                blood_pressure_s: 120,
                blood_pressure_d: 80,
                fasting_glucose: 90,
                tg: 100,
                hdl: 60,
                ldl: 100,
                ast: 25,
                alt: 25,
                gamma_gtp: 30,
                bmi: 22.5,
                health_score: 85,
                source_type: 'ocr'
            };
            const [result] = await conn.query('INSERT INTO health_data SET ?', [healthDataFields]);
            healthDataId = result.insertId;
        } else {
            healthDataId = existingData[0].id;
        }

        const [existingAiReport] = await conn.query('SELECT id FROM ai_reports WHERE user_id = ? AND exam_year = ?', [userId, year]);
        if (existingAiReport.length === 0) {
            const riskOverview = [
                { title: '심혈관 질환 위험', status: '안전', description: '현재 위험 요인이 특별히 관찰되지 않습니다.' },
                { title: '간 질환 위험', status: '주의', description: '간 수치가 약간 높을 수 있으니 음주를 줄여주세요.' }
            ];

            const aiReportFields = {
                user_id: userId,
                health_data_id: healthDataId,
                exam_year: year,
                summary: '전반적으로 매우 양호한 건강 상태입니다. 꾸준한 운동과 규칙적인 식습관을 유지하세요.',
                medical_recommendation: '정기적인 검진을 통해 현재 상태를 유지하는 것이 좋습니다.',
                risk_overview: JSON.stringify(riskOverview),
                organ_heart_status: 'normal',
                organ_liver_status: 'borderline',
                organ_pancreas_status: 'normal',
                organ_abdomen_status: 'normal',
                organ_vessels_status: 'normal',
                analysis_precision: 98
            };
            await conn.query('INSERT INTO ai_reports SET ?', [aiReportFields]);
            console.log("Test report data created.");
        } else {
            console.log("Test report data already exists.");
        }

    } catch(e) {
        console.error(e);
    } finally {
        await conn.end();
    }
}
setup();
