const mysql = require('mysql2/promise');
const { Pool } = require('pg');
require('dotenv').config();

let pool;
let isPostgres = false;

// 1. Database Connection Logic
if (process.env.DATABASE_URL) {
    // [Production/Supabase] Use PostgreSQL
    console.log('--- Connecting to Supabase (PostgreSQL) ---');
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    isPostgres = true;
} else {
    // [Local/Development] Use MySQL
    console.log('--- Connecting to Local MySQL ---');
    pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
}

/**
 * Compatibility layer to handle both MySQL (?) and PostgreSQL ($1) syntax
 */
const query = async (sql, params = []) => {
    if (isPostgres) {
        // PostgreSQL compatibility
        let pgSql = sql;
        
        // 1. Handle MySQL type Casting/Functions if necessary (basic replacement)
        pgSql = pgSql.replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');

        // 2. Handle placeholders (? -> $1, $2...)
        let i = 1;
        while (pgSql.includes('?')) {
            pgSql = pgSql.replace('?', `$${i++}`);
        }

        // 3. Automated RETURNING clause for INSERT if insertId might be needed
        if (pgSql.trim().toUpperCase().startsWith('INSERT INTO') && !pgSql.toUpperCase().includes('RETURNING')) {
            pgSql += ' RETURNING id';
        }

        try {
            const { rows } = await pool.query(pgSql, params);
            
            // Mimic mysql2 result structure
            const mockResult = rows.length > 0 ? rows : [];
            mockResult.insertId = rows.length > 0 ? rows[0].id : null;
            
            return [mockResult];
        } catch (err) {
            console.error('PG Query Error:', err.message, '| SQL:', pgSql);
            throw err;
        }
    } else {
        // Direct MySQL query
        return await pool.query(sql, params);
    }
};

module.exports = {
    query,
    pool,
    isPostgres
};
