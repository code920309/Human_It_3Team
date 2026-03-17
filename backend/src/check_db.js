const mysql = require('mysql2/promise');
require('dotenv').config({path: '.env'});

async function check() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    try {
        const [users] = await conn.query('SELECT id, email, name, email_verified FROM users WHERE email = ?', ['test@test.com']);
        console.log('User:', users[0]);
        
        if (users.length > 0) {
            const userId = users[0].id;
            const [hd] = await conn.query('SELECT * FROM health_data WHERE user_id = ?', [userId]);
            console.log('Health Data Count:', hd.length);
            console.log('Latest Health Data:', hd[0]);
            
            const [ar] = await conn.query('SELECT * FROM ai_reports WHERE user_id = ?', [userId]);
            console.log('AI Reports Count:', ar.length);
        }
    } catch(e) {
        console.error(e);
    } finally {
        await conn.end();
    }
}
check();
