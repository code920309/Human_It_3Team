const mysql = require('mysql2/promise');
require('dotenv').config({path: '.env'});

async function checkChatHistory() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    try {
        const [history] = await conn.query('SELECT role, message, created_at FROM chatbot_history ORDER BY created_at DESC LIMIT 5');
        console.log('Last 5 Messages:', history);
    } catch(e) {
        console.error(e);
    } finally {
        await conn.end();
    }
}
checkChatHistory();
