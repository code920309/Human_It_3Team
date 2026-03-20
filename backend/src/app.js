const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env'); // [최적화] 환경 변수 매니저 도입

const app = express();

const contactRoutes = require('./routes/contactRoutes');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const actionPlanRoutes = require('./routes/actionPlanRoutes');
const reviewRoutes = require('./routes/reviewRoutes'); //리뷰 담당 라우터 불러오기

// [수정] AWS Lambda(Netlify)의 읽기 전용 파일 시스템(EROFS) 에러를 방지하기 위해 파일 로그 기록 제거.
// Netlify Functions 환경에서는 console.log / console.error 만으로도 대시보드에 로그가 영구 기록됩니다.

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
apiRouter.use('/reviews', reviewRoutes); // '/api/reviews' 경로가 호출되면 신규 라우터로 연결

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
            has_db_url: !!env.DATABASE_URL
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
            stack: err.stack,
            has_db_url: !!env.DATABASE_URL,
            isPostgres: dbConfig.isPostgres
        });
    }
});

// Request logger 및 에러 핸들러
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// [최적화] 전역 에러 핸들러 (JSON 응답 보장)
// 대표님, 업로드 파일 형식 오류 등 실시간으로 발생하는 예외를 사용자에게 친절하게 전달하기 위해 추가했습니다.
app.use((err, req, res, next) => {
    console.error('--- Global Error Handler ---');
    console.error('Error Message:', err.message);
    
    // Multer 파일 필터 에러 등은 400 Bad Request로 처리
    const status = err.message.includes('지원하지 않는 파일 형식') ? 400 : 500;
    
    res.status(status).json({
        success: false,
        message: err.message || '서버 내부 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Export app for serverless functions
module.exports = app;

// Port Settings (Only run listen if not in a serverless environment)
if (require.main === module) {
    const PORT = env.PORT;
    app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`🚀 CareLink Backend Server is running!`);
        console.log(`📡 URL: http://localhost:${PORT}`);
        console.log(`📂 DB: ${env.DATABASE_URL ? 'Cloud PostgreSQL' : 'Local MySQL'}`);
        console.log(`====================================================`);
    });
}
