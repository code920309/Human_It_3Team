const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function init() {
    const sql = fs.readFileSync('src/config/db_init.sql', 'utf8');
    const statements = sql
        .split(/;(?:\r?\n|$)/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    console.log('Starting database initialization...');
    for (const statement of statements) {
        try {
            await connection.query(statement);
            console.log('✅ Executed: ' + statement.substring(0, 50).replace(/\n/g, ' ') + '...');
        } catch (err) {
            console.error('❌ Error executing statement:', err.message);
            console.error('Statement:', statement);
        }
    }
    await connection.end();
    console.log('Database initialization complete.');
}

init().catch(console.error);
