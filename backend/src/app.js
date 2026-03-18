const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const contactRoutes = require('./routes/contactRoutes');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const actionPlanRoutes = require('./routes/actionPlanRoutes');

const fs = require('fs');
const path = require('path');
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

app.use((req, res, next) => {
    const log = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
    fs.appendFileSync(path.join(logDir, 'access.log'), log);
    next();
});

// Mock Error Logger
app.use((err, req, res, next) => {
    const log = `[${new Date().toISOString()}] ERROR: ${err.message}\n${err.stack}\n`;
    fs.appendFileSync(path.join(logDir, 'error.log'), log);
    next(err);
});

// [보안] CORS 설정 - credentials 허용
app.use(cors({
    origin: true, // 로컬 개발 및 배포 환경 대응
    credentials: true
}));

app.use(cookieParser());
// express.json 및 express.urlencoded
// 단, multipart/form-data 는 multer 에 맡기기 위해 예외 처리
app.use((req, res, next) => {
    if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
        return next();
    }
    express.json({ type: '*/*' })(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    // 1. Handle if req.body is already a Buffer
    if (Buffer.isBuffer(req.body)) {
        try {
            req.body = JSON.parse(req.body.toString('utf8'));
        } catch (e) { }
    }

    // 2. Heavy-duty reconstruction for serverless indexed bodies
    const keys = Object.keys(req.body || {});
    const isIndexed = keys.length > 0 && keys.every(key => !isNaN(key));

    if (isIndexed && req.body[0] !== undefined) {
        try {
            let reconstructed = '';
            // Check if it's byte numbers (e.g., 123, 34) or characters (e.g., '{', '"')
            if (typeof req.body[0] === 'number') {
                reconstructed = Buffer.from(Object.values(req.body)).toString('utf8');
            } else {
                reconstructed = Object.values(req.body).join('');
            }
            req.body = JSON.parse(reconstructed);
        } catch (e) {
            // If parsing fails, it might not be JSON, leave as is
        }
    }

    // 3. Last fallback: Check Netlify/AWS raw event
    if ((!req.body || Object.keys(req.body).length === 0 || typeof req.body === 'number') && req.apiGateway && req.apiGateway.event) {
        try {
            let eventBody = req.apiGateway.event.body;
            if (req.apiGateway.event.isBase64Encoded) {
                eventBody = Buffer.from(eventBody, 'base64').toString('utf8');
            }
            if (eventBody) req.body = JSON.parse(eventBody);
        } catch (e) { }
    }

    // 4. Force string-to-json if it ended up as a string
    if (typeof req.body === 'string') {
        try {
            req.body = JSON.parse(req.body);
        } catch (e) { }
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

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
