const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken'); // 기존 JWT 방식 유지 (프론트엔드 호환성)
const pool = require('../config/db');
/* [충돌해결] Supabase Auth 기반으로 통합 및 보안 기능(IP 체크 등)을 추가했습니다. */
const supabase = require('../config/supabaseClient');

// [유틸] 확장된 IP 추출 함수
const getClientIp = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
};

/**
 * [STEP 1] 이메일 인증 코드 요청 (Supabase Auth 사용)
 */
exports.requestOTP = async (req, res) => {
    if (!supabase) {
        return res.status(500).json({ success: false, message: 'Supabase 설정이 누락되었습니다.' });
    }

    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: '이메일을 입력해주세요.' });

    try {
        // 이미 가입 및 인증된 이메일인지 확인
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ? AND email_verified = true', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: '이미 가입된 이메일입니다.' });
        }

        // Supabase OTP 발송
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: true }
        });

        if (error) throw error;

        // 임시 유저 생성 또는 업데이트
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            await pool.query(
                'INSERT INTO users (email, password_hash, name, birth_date, gender) VALUES (?, ?, ?, ?, ?)',
                [email, 'supabase_auth_managed', 'Temp', '1900-01-01', 'M']
            );
        }

        return res.json({ success: true, message: '인증코드가 사용자의 이메일로 발송되었습니다.' });
    } catch (err) {
        console.error('requestOTP error:', err.message);
        return res.status(500).json({ success: false, message: '인증번호 발송 실패' });
    }
};

/**
 * [STEP 2] 이메일 인증 코드 검증
 */
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: '필수 항목 누락' });

    try {
        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'signup'
        });

        if (error) {
            // signup 타입으로 실패 시 magiclink 타입으로 재시도
            const { error: retryError } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'magiclink'
            });
            if (retryError) return res.status(400).json({ success: false, message: '인증번호가 틀렸거나 만료되었습니다.' });
        }

        // 인증 성공 시 DB 업데이트
        await pool.query('UPDATE users SET email_verified = true WHERE email = ?', [email]);

        return res.json({ success: true, message: '이메일 인증 완료' });
    } catch (err) {
        console.error('verifyOTP error:', err);
        return res.status(500).json({ success: false, message: '서버 오류' });
    }
};

/**
 * [STEP 3] 최종 회원가입
 */
exports.signup = async (req, res) => {
    const { password, name, birth_date, gender, marketing_agreed } = req.body;
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : '';

    if (!email || !password || !name || !birth_date || !gender) {
        return res.status(400).json({ success: false, message: '모든 항목을 입력해주세요.' });
    }

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0 || !users[0].email_verified) {
            return res.status(400).json({ success: false, message: '이메일 인증을 먼저 완료해주세요.' });
        }

        // Supabase 비밀번호 설정
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;

        // 로컬 DB 비밀번호 해싱 및 프로필 업데이트
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const clientIp = getClientIp(req);

        await pool.query(
            `UPDATE users SET password_hash = ?, name = ?, birth_date = ?, gender = ?, marketing_agreed = ?, last_login_ip = ? WHERE email = ?`,
            [hashedPassword, name, birth_date, gender, marketing_agreed === true, clientIp, email]
        );

        return res.json({ success: true, message: '회원가입이 완료되었습니다.' });
    } catch (err) {
        console.error('signup error:', err.message);
        return res.status(500).json({ success: false, message: '서버 오류' });
    }
};

/**
 * [LOGIN] 로그인
 */
exports.login = async (req, res) => {
    const { password, loginOption } = req.body;
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : '';

    if (!email || !password) return res.status(400).json({ success: false, message: '이메일과 비밀번호를 입력해주세요.' });

    try {
        // 1. Supabase Auth 로그인
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 틀렸습니다.' });

        // 2. 로컬 DB 사용자 정보 및 IP 업데이트
        const [users] = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
        if (users.length === 0) return res.status(400).json({ success: false, message: '프로필을 찾을 수 없습니다.' });

        const user = users[0];
        const currentIp = getClientIp(req);
        await pool.query('UPDATE users SET last_login_ip = ?, login_option = ? WHERE id = ?', [currentIp, loginOption || 'none', user.id]);

        // 3. 토큰 발급 (기존 JWT 방식 유지)
        const token = jwt.sign(
            { id: user.id, email: user.email, supabase_id: data.user.id },
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
        console.error('login error:', err.message);
        return res.status(500).json({ success: false, message: '서버 오류' });
    }
};

/**
 * [GETME] 내 정보 조회
 */
exports.getMe = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, email, name, birth_date, gender, phone FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        return res.json({ success: true, data: users[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: '조회 실패' });
    }
};

/**
 * [UPDATE] 프로필 수정
 */
exports.updateProfile = async (req, res) => {
    const { name, birth_date, gender, phone } = req.body;
    try {
        await pool.query(
            'UPDATE users SET name = ?, birth_date = ?, gender = ?, phone = ? WHERE id = ?',
            [name, birth_date, gender, phone, req.user.id]
        );
        return res.json({ success: true, message: '프로필이 성공적으로 수정되었습니다.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: '서버 오류' });
    }
};

/**
 * [PASSWORD] 비밀번호 변경
 */
exports.updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ success: false, message: '사용자 없음' });
        
        const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!isMatch) return res.status(401).json({ success: false, message: '현재 비밀번호 불일치' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, req.user.id]);

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;

        return res.json({ success: true, message: '비밀번호 변경 완료' });
    } catch (err) {
        console.error('updatePassword error:', err.message);
        return res.status(500).json({ success: false, message: '서버 오류' });
    }
};
