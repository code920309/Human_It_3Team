const fs = require('fs');
const path = require('path');
const { pool, query } = require('./config/db');

async function initialize() {
    console.log('--- Initializing Supabase Database ---');
    
    try {
        const sqlPath = path.join(__dirname, 'config', 'supabase_init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Split SQL by semicolon, but be careful with functions or complex blocks
        // For simple schemas, we can split by semicolon
        const commands = sql
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0);
            
        for (let cmd of commands) {
            console.log(`Executing: ${cmd.substring(0, 50)}...`);
            await query(cmd);
        }
        
        console.log('--- Database Initialization Completed ---');
    } catch (err) {
        console.error('Initialization Error:', err);
    } finally {
        process.exit();
    }
}

initialize();
