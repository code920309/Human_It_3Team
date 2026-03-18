const { Pool } = require('pg');
require('dotenv').config();

async function checkHistoryPg() {
    if (!process.env.DATABASE_URL) {
        console.log("No DATABASE_URL found");
        return;
    }
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const { rows } = await pool.query('SELECT role, message, created_at FROM chatbot_history ORDER BY created_at DESC LIMIT 5');
        console.log('Last 5 Messages (PG):', rows);
    } catch(e) {
        console.error("PG Error:", e.message);
    } finally {
        await pool.end();
    }
}
checkHistoryPg();
