const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/db');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/tokenUtil');
const { sendOTP } = require('../utils/emailService');

// [유틸] 6자리 숫자 OTP 코드를 생성하는 함수
const generateOTPCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// [유틸] 확장된 IP 추출 함수
const getClientIp = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
};

/**
 * [STEP 1] 이메일 인증 코드 요청
 */
exports.requestOTP = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: '이메일을 입력해주세요.' });

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length > 0 && users[0].email_verified) {
            return res.status(400).json({ success: false, message: '이미 가입된 이메일입니다.' });
        }

        const otp = generateOTPCode();
        const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3분

        if (users.length > 0) {
            await pool.query(
                'UPDATE users SET email_change_token = ?, email_token_expires = ? WHERE email = ?',
                [otp, expiresAt, email]
            );
        } else {
            // 임시 가입 상태로 생성
            await pool.query(
                `INSERT INTO users (email, email_change_token, email_token_expires, password_hash, name, birth_date, gender) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [email, otp, expiresAt, 'temp_hash', 'Temp', '1900-01-01', 'M']
            );
        }

        await sendOTP(email, otp, 'verify');
        return res.json({ success: true, message: '인증코드가 발송되었습니다. (3분 유효)' });
    } catch (err) {
        console.error('requestOTP error:', err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

/**
 * [STEP 2] 이메일 인증 코드 검증
 */
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: '필수 항목이 누락되었습니다.' });

    try {
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ? AND email_change_token = ? AND email_token_expires > CURRENT_TIMESTAMP',
            [email, otp]
        );

        if (users.length === 0) {
            return res.status(400).json({ success: false, message: '인증코드가 틀렸거나 만료되었습니다.' });
        }

        await pool.query(
            'UPDATE users SET email_verified = true, email_change_token = NULL, email_token_expires = NULL WHERE email = ?', 
            [email]
        );

        return res.json({ success: true, message: '이메일 인증이 완료되었습니다.' });
    } catch (err) {
        console.error('verifyOTP error:', err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

/**
 * [STEP 3] 최종 회원가입
 */
exports.register = async (req, res) => {
    const { password, name, birth_date, gender, marketing_agreed } = req.body;
    const email = req.body.email ? req.body.email.trim() : '';
    
    if (!email || !password || !name || !birth_date || !gender) {
        return res.status(400).json({ success: false, message: '모든 필수 항목을 입력해주세요.' });
    }

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0 || !users[0].email_verified) {
            return res.status(400).json({ success: false, message: '이메일 인증을 먼저 완료해주세요.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const clientIp = getClientIp(req);

        await pool.query(
            `UPDATE users 
             SET password_hash = ?, name = ?, birth_date = ?, gender = ?, marketing_agreed = ?, last_login_ip = ?
             WHERE email = ?`,
            [hashedPassword, name, birth_date, gender, marketing_agreed === true, clientIp, email]
        );

        return res.json({ success: true, message: '회원가입이 완료되었습니다.' });
    } catch (err) {
        console.error('register error:', err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

/**
 * [LOGIN] 로그인 및 토큰 발급
 */
exports.login = async (req, res) => {
    const { password, loginOption } = req.body;
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : '';

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
        if (users.length === 0) {
            return res.status(400).json({ success: false, message: '가입되지 않은 이메일입니다.' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: '이메일 또는 비밀번호가 틀렸습니다.' });
        }

        const currentIp = getClientIp(req);
        const validOption = ['none', 'keep', 'save_id'].includes(loginOption) ? loginOption : 'none';
        await pool.query('UPDATE users SET last_login_ip = ?, login_option = ? WHERE id = ?', [currentIp, validOption, user.id]);

        // 토큰 발급
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user.id);
        
        // Refresh Token을 HttpOnly 쿠키에 저장
        res.cookie('carelink_refresh', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30일
        });

        return res.json({
            success: true,
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                login_option: validOption
            }
        });
    } catch (err) {
        console.error('login error:', err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

/**
 * [LOGOUT] 블랙리스트 등록 및 쿠키 제거
 */
exports.logout = async (req, res) => {
    try {
        const refreshToken = req.cookies?.carelink_refresh;
        
        if (refreshToken) {
            const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
            const decoded = verifyToken(refreshToken);
            const expDate = decoded ? new Date(decoded.exp * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            
            await pool.query(
                'INSERT INTO blacklisted_tokens (token_hash, expires_at) VALUES (?, ?) ON CONFLICT (token_hash) DO NOTHING',
                [tokenHash, expDate]
            );
        }

        res.clearCookie('carelink_refresh', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return res.json({ success: true, message: '로그아웃 되었습니다.' });
    } catch (err) {
        console.error('logout error:', err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

/**
 * [REFRESH] Access Token 재발급
 */
exports.refresh = async (req, res) => {
    const refreshToken = req.cookies?.carelink_refresh;

    if (!refreshToken) {
        return res.status(401).json({ success: false, message: '세션이 만료되었습니다.' });
    }

    try {
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const [blacklisted] = await pool.query('SELECT * FROM blacklisted_tokens WHERE token_hash = ?', [tokenHash]);
        
        if (blacklisted.length > 0) {
            return res.status(403).json({ success: false, message: '비정상적인 접근입니다.' });
        }

        const decoded = verifyToken(refreshToken);
        if (!decoded || !decoded.isRefresh) {
            return res.status(403).json({ success: false, message: '유효하지 않은 세션입니다.' });
        }

        const [users] = await pool.query('SELECT id, email, name FROM users WHERE id = ?', [decoded.id]);
        if (users.length === 0) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        
        const user = users[0];
        const newAccessToken = generateAccessToken(user);

        return res.json({
            success: true,
            accessToken: newAccessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (err) {
        console.error('refresh error:', err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, email, name, birth_date, gender FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ success: false, message: '사용자가 없습니다.' });
        return res.json({ success: true, data: users[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: '조회 실패' });
    }
};
