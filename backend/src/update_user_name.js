const mysql = require('mysql2/promise');
require('dotenv').config({path: '.env'});

async function update() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    try {
        await conn.query('UPDATE users SET name = ? WHERE email = ?', ['박지연', 'test@test.com']);
        console.log('User name updated to 박지연.');
    } catch(e) {
        console.error(e);
    } finally {
        await conn.end();
    }
}
update();
