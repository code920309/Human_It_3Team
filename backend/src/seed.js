const { query, isPostgres } = require('./config/db');
const bcrypt = require('bcryptjs');

/**
 * Seeding script for both MySQL and PostgreSQL (Supabase)
 * This script uses the unified query interface from db.js
 */
async function seed() {
    console.log(`--- Starting Seed Process (${isPostgres ? 'PostgreSQL' : 'MySQL'}) ---`);
    
    try {
        const email = 'test@test.com';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        
        // 1. Create or Update Test User
        const [users] = await query('SELECT * FROM users WHERE email = ?', [email]);
        
        let userId;
        if (users.length === 0) {
            console.log('Creating new test user...');
            const [result] = await query(
                'INSERT INTO users (email, password_hash, name, birth_date, gender, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
                [email, hashedPassword, '테스터', '1990-01-01', 'M', true]
            );
            userId = result.insertId;
        } else {
            console.log('Test user already exists. Updating password...');
            userId = users[0].id;
            await query(
                'UPDATE users SET password_hash = ?, email_verified = ? WHERE email = ?',
                [hashedPassword, true, email]
            );
        }

        console.log(`User ID: ${userId}`);

        // 2. Create Healthcare Data for 2024
        const year = 2024;
        const [existingData] = await query('SELECT id FROM health_data WHERE user_id = ? AND exam_year = ?', [userId, year]);
        
        let healthDataId;
        if (existingData.length === 0) {
            console.log(`Creating health data for ${year}...`);
            const [result] = await query(
                `INSERT INTO health_data (
                    user_id, exam_year, waist, blood_pressure_s, blood_pressure_d, fasting_glucose, 
                    tg, hdl, ldl, ast, alt, gamma_gtp, bmi, health_score, source_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, year, 85.0, 120.0, 80.0, 95.0, 110.0, 65.0, 90.0, 22.0, 25.0, 30.0, 23.5, 88, 'ocr']
            );
            healthDataId = result.insertId;
        } else {
            healthDataId = existingData[0].id;
            console.log(`Health data for ${year} already exists.`);
        }

        // 3. Create AI Report
        const [existingReport] = await query('SELECT id FROM ai_reports WHERE user_id = ? AND exam_year = ?', [userId, year]);
        if (existingReport.length === 0) {
            console.log(`Creating AI report for ${year}...`);
            const riskOverview = [
                { title: '심혈관 건강', status: '안전', description: '혈압과 콜레스테롤 수치가 정상 범위입니다.' },
                { title: '당뇨 위험', status: '정상', description: '공복 혈당이 안정적입니다.' }
            ];

            await query(
                `INSERT INTO ai_reports (
                    user_id, health_data_id, exam_year, summary, medical_recommendation, 
                    risk_overview, organ_heart_status, organ_liver_status, organ_pancreas_status, 
                    organ_abdomen_status, organ_vessels_status, analysis_precision
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId, healthDataId, year, 
                    '전반적으로 아주 건강한 상태입니다. 현재의 식단과 운동 습관을 유지해 주세요.',
                    '정기적인 유산소 운동을 주 3회 이상 권장합니다.',
                    JSON.stringify(riskOverview),
                    'normal', 'normal', 'normal', 'normal', 'normal', 95
                ]
            );
        } else {
            console.log(`AI report for ${year} already exists.`);
        }

        // 4. Create Sample Action Plans
        const [existingPlans] = await query('SELECT id FROM action_plans WHERE user_id = ? AND health_data_id = ?', [userId, healthDataId]);
        if (existingPlans.length === 0) {
            console.log('Creating sample action plans...');
            const samplePlans = [
                ['exercise', '하루 30분 걷기', '매일 가벼운 산책으로 기초 대사량을 유지하세요.', 'easy'],
                ['diet', '물 2L 마시기', '충분한 수분 섭취는 신진대사를 돕습니다.', 'easy'],
                ['lifestyle', '7시간 수면 확보', '충분한 휴식은 면역력을 높여줍니다.', 'medium']
            ];

            for (const p of samplePlans) {
                await query(
                    'INSERT INTO action_plans (user_id, health_data_id, category, title, content, difficulty, is_completed) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [userId, healthDataId, p[0], p[1], p[2], p[3], false]
                );
            }
        }

        console.log('--- Seeding Completed Successfully! ---');
        console.log('ID: test@test.com / PW: password123');
        
    } catch (err) {
        console.error('Seed Error:', err);
    } finally {
        process.exit();
    }
}

seed();
