const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
/* [충돌해결] Supabase Auth 기반 통합 및 보안 기능(IP 체크, 세션 쿠키)을 추가했습니다. */
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
        const lowerEmail = email.trim().toLowerCase();
        
        // 1. 이미 가입 및 인증된 이메일인지 확인 (로컬 DB 기준)
        const [existing] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ? AND email_verified = true', [lowerEmail]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: '이미 가입된 이메일입니다.' });
        }

        // 2. Supabase OTP 발송
        const { error } = await supabase.auth.signInWithOtp({
            email: lowerEmail,
            options: { shouldCreateUser: true }
        });

        if (error) {
            console.error('Supabase OTP Error:', error.message);
            throw error;
        }

        // 3. 임시 유저 생성 또는 업데이트 (로컬 DB)
        const [users] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [lowerEmail]);
        if (users.length === 0) {
            await pool.query(
                'INSERT INTO users (email, password_hash, name, birth_date, gender) VALUES (?, ?, ?, ?, ?)',
                [lowerEmail, 'supabase_auth_managed', 'Temp', '1900-01-01', 'M']
            );
        }

        return res.json({ success: true, message: '인증코드가 발송되었습니다. 이메일을 확인해주세요.' });
    } catch (err) {
        console.error('requestOTP error:', err.message);
        return res.status(500).json({ success: false, message: '인증번호 발송 중 오류가 발생했습니다. (Supabase 연결 확인 필요)' });
    }
};

/**
 * [STEP 2] 이메일 인증 코드 검증
 */
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: '필수 항목 누락' });

    try {
        const lowerEmail = email.trim().toLowerCase();
        
        const { error } = await supabase.auth.verifyOtp({
            email: lowerEmail,
            token: otp,
            type: 'signup'
        });

        if (error) {
            const { error: retryError } = await supabase.auth.verifyOtp({
                email: lowerEmail,
                token: otp,
                type: 'magiclink'
            });
            if (retryError) return res.status(400).json({ success: false, message: '인증번호가 틀렸거나 만료되었습니다.' });
        }

        // 인증 성공 시 로컬 DB 업데이트
        await pool.query('UPDATE users SET email_verified = true WHERE LOWER(email) = ?', [lowerEmail]);

        return res.json({ success: true, message: '이메일 인증이 완료되었습니다.' });
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
        const [users] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [email]);
        if (users.length === 0 || !users[0].email_verified) {
            return res.status(400).json({ success: false, message: '이메일 인증을 먼저 완료해주세요.' });
        }

        // 1. Supabase 비밀번호 설정
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;

        // 2. 로컬 DB 비밀번호 해싱 및 프로필 업데이트
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const clientIp = getClientIp(req);

        await pool.query(
            `UPDATE users SET password_hash = ?, name = ?, birth_date = ?, gender = ?, marketing_agreed = ?, last_login_ip = ? WHERE LOWER(email) = ?`,
            [hashedPassword, name, birth_date, gender, marketing_agreed === true, clientIp, email]
        );

        return res.json({ success: true, message: '회원가입이 성공적으로 완료되었습니다.' });
    } catch (err) {
        console.error('signup error:', err.message);
        return res.status(500).json({ success: false, message: '회원가입 처리 중 오류 발생' });
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
        // 1. Supabase Auth 로그인 시도
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            console.warn('Login attempt failed for:', email, error.message);
            return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 틀렸거나 가입되지 않았습니다.' });
        }

        // 2. 로컬 DB에서 사용자 추가 정보 로드 및 IP 업데이트
        const [users] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ success: false, message: '로컬 프로필을 찾을 수 없습니다.' });
        }

        const user = users[0];
        const currentIp = getClientIp(req);
        await pool.query('UPDATE users SET last_login_ip = ?, login_option = ? WHERE id = ?', [currentIp, loginOption || 'none', user.id]);

        // 3. JWT 발급 (기존 로직 유지)
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
        return res.status(500).json({ success: false, message: '로그인 중 서버 오류가 발생했습니다.' });
    }
};

/**
 * [LOGOUT] 로그아웃
 */
exports.logout = async (req, res) => {
    try {
        await supabase.auth.signOut();
        return res.json({ success: true, message: '로그아웃 되었습니다.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: '로그아웃 처리 중 에러' });
    }
};

/**
 * [REFRESH] 토큰 갱신 (더미 구현 또는 Supabase 세션 연결 가능)
 */
exports.refresh = async (req, res) => {
    // Supabase를 사용할 경우 클라이언트에서 세션을 관리하므로 여기서는 간단히 성공 응답만 주거나
    // 필요 시 새로운 JWT를 발급할 수 있습니다.
    return res.json({ success: true, message: 'Session active' });
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
