const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.requestOTP = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: '이메일을 입력해주세요.' });

    try {
        // Check if user exists and is already verified
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length > 0 && users[0].email_verified) {
            return res.status(400).json({ success: false, message: '이미 가입된 이메일입니다.' });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

        if (users.length > 0) {
            // Update existing unverified user
            await pool.query(
                'UPDATE users SET email_change_token = ?, email_token_expires = ? WHERE email = ?',
                [otp, expiresAt, email]
            );
        } else {
            // Create temporary user record (with dummy values)
            await pool.query(
                'INSERT INTO users (email, email_change_token, email_token_expires, password_hash, name, birth_date, gender) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [email, otp, expiresAt, 'temp_hash', 'Temp', '1900-01-01', 'M']
            );
        }

        console.log(`[MOCK EMAIL] OTP for ${email}: ${otp}`);
        return res.json({ success: true, message: '인증코드가 발송되었습니다. (콘솔 확인)' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: '필수 항목이 누락되었습니다.' });

    try {
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ? AND email_change_token = ? AND email_token_expires > NOW()',
            [email, otp]
        );

        if (users.length === 0) {
            return res.status(400).json({ success: false, message: '인증코드가 틀렸거나 만료되었습니다.' });
        }

        await pool.query('UPDATE users SET email_verified = true, email_change_token = NULL, email_token_expires = NULL WHERE email = ?', [email]);

        return res.json({ success: true, message: '이메일 인증이 완료되었습니다.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

exports.signup = async (req, res) => {
    const { password, name, birth_date, gender } = req.body;
    const email = req.body.email ? req.body.email.trim() : '';
    
    if (!email || !password || !name || !birth_date || !gender) {
        return res.status(400).json({ success: false, message: '모든 항목을 입력해주세요.' });
    }

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0 || !users[0].email_verified) {
            return res.status(400).json({ success: false, message: '이메일 인증을 먼저 완료해주세요.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.query(
            'UPDATE users SET password_hash = ?, name = ?, birth_date = ?, gender = ? WHERE email = ?',
            [hashedPassword, name, birth_date, gender, email]
        );

        return res.json({ success: true, message: '회원가입이 완료되었습니다.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

exports.login = async (req, res) => {
    const { password } = req.body;
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : '';

    try {
        // Revert to '?' which is handled by our db.js adapter for maximum consistency
        const [users] = await pool.query(
            'SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(?)', 
            [email]
        );
        
        if (users.length === 0) {
            const bodyType = typeof req.body;
            const bodyKeys = Object.keys(req.body || {}).join(', ');
            const bodyPreview = JSON.stringify(req.body).substring(0, 100);
            return res.status(400).json({ 
                success: false, 
                message: `가입되지 않은 이메일입니다. (입력: [${email}], 길이: ${email.length}, 타입: ${bodyType}, 키: [${bodyKeys}], 내용: ${bodyPreview})` 
            });
        }

        if (!users[0].email_verified) {
            return res.status(400).json({ success: false, message: '이메일 인증이 완료되지 않은 계정입니다.' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: '이메일 또는 비밀번호가 틀렸습니다.' });
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined in environment variables!');
            return res.status(500).json({ success: false, message: '인증 서버 설정 오류 (JWT_SECRET 누락)' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, email, name, birth_date, gender, phone FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        return res.json({ success: true, data: users[0] });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};
