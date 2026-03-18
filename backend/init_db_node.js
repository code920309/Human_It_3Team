const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function init() {
    console.log("Connecting to MySQL to initialize 'carelink' database...");
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            port: process.env.DB_PORT || 3306
        });

        console.log(`Creating database ${process.env.DB_NAME}...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        await connection.query(`USE ${process.env.DB_NAME}`);
        
        const sqlPath = path.join(__dirname, 'src', 'config', 'db_init.sql');
        console.log(`Reading SQL from ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // rudimentary split by ';'
        const queries = sql.split(';').filter(q => q.trim().length > 0);
        
        for (let q of queries) {
            console.log(`Executing: ${q.substring(0, 50).replace(/\n/g, ' ')}...`);
            await connection.query(q);
        }
        
        console.log('Database initialized successfully!');
    } catch (err) {
        console.error('Error during DB init:', err);
    } finally {
        if (connection) await connection.end();
    }
}

init();
