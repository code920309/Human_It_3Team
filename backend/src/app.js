const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const contactRoutes = require('./routes/contactRoutes');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const actionPlanRoutes = require('./routes/actionPlanRoutes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serverless Body Parser Fix
app.use((req, res, next) => {
    // 1. Handle indexed objects (e.g., { 0: '{', 1: '"', ... })
    if (req.body && !req.body.email && req.body[0] !== undefined) {
        try {
            const rawBody = Object.values(req.body).join('');
            req.body = JSON.parse(rawBody);
        } catch (e) {
            console.error('Failed to parse reconstructed body:', e.message);
        }
    }

    // 2. Fallback to rawBody if still empty or not parsed correctly
    if (!req.body || Object.keys(req.body).length === 0 || (!req.body.email && !req.body.password)) {
        if (req.rawBody) {
            try {
                req.body = JSON.parse(req.rawBody.toString());
            } catch (e) {
                // Ignore
            }
        }
    }
    next();
});

app.use('/uploads', express.static('uploads'));

// API Router
const apiRouter = express.Router();
apiRouter.use('/contacts', contactRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/chatbot', chatbotRoutes);
apiRouter.use('/action-plans', actionPlanRoutes);

// Mount the API router at both common prefixes
app.use('/api', apiRouter);
app.use('/.netlify/functions/api', apiRouter);

// Basic Route for health check
app.get('/', (req, res) => res.send('CareLink Backend API is running...'));
app.get('/.netlify/functions/api', (req, res) => res.send('CareLink Backend API (Netlify) is running...'));

// Diagnostic Route
const dbConfig = require('./config/db');
app.get('/.netlify/functions/api/debug-db', async (req, res) => {
    try {
        const [rows] = await dbConfig.query('SELECT current_database(), current_user');
        const [userList] = await dbConfig.query('SELECT email, LENGTH(email) as len, email_verified, name FROM users LIMIT 5');
        
        // Simulation of login query
        const testEmail = 'test@test.com';
        const [sim] = await dbConfig.query('SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(?)', [testEmail]);

        res.json({ 
            success: true, 
            isPostgres: dbConfig.isPostgres,
            info: rows[0],
            users: userList,
            login_sim: {
                target: testEmail,
                found: sim.length > 0,
                user: sim[0] ? { email: sim[0].email, verified: sim[0].email_verified } : null
            },
            has_db_url: !!process.env.DATABASE_URL
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            error: err.message,
            stack: err.stack,
            has_db_url: !!process.env.DATABASE_URL,
            isPostgres: dbConfig.isPostgres
        });
    }
});

// Export app for serverless functions
module.exports = app;

// Port Settings (Only run listen if not in a serverless environment)
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
