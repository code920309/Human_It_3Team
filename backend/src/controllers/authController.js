const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
/* [수정] Supabase Auth 완전 전환을 위한 서비스 임포트 */
const supabase = require('../config/supabaseClient');

// Helper to generate 6-digit OTP (Supabase 자체 OTP를 사용할 경우 불필요할 수 있으나, 기존과 동일한 흐름을 위해 보존하거나 Supabase 기능을 호출함)
/* [수정] Supabase Auth API를 사용한 실제 이메일 인증번호 발송 (기존 local generateOTP 제거) */

/* [수정] Supabase Auth API를 사용한 실제 이메일 인증번호 발송 */
exports.requestOTP = async (req, res) => {
    if (!supabase) {
        return res.status(500).json({ success: false, message: '서버 환경 변수(SUPABASE_URL, ANON_KEY) 설정이 누락되어 이메일을 발송할 수 없습니다. (Netlify 대시보드 확인 필요)' });
    }

    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: '이메일을 입력해주세요.' });

    try {
        // [수정] Supabase Auth API로 OTP 발송 요청. 
        // Supabase 설정에서 'Email OTP'가 활성화되어 있어야 하며, 6자리 숫자가 발송됩니다.
        const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true // 가입 전이라도 일단 유저 생성 시도 (대기 상태)
            }
        });

        if (error) {
            console.error('Supabase OTP Request Error:', error.message);
            return res.status(400).json({ success: false, message: '인증번호 발송 실패: ' + error.message });
        }

        /* [수정] 기존의 임시 유저 관리 로직 (DB 연동은 유지하되 메일 발송만 Supabase에 위임) */
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            await pool.query(
                'INSERT INTO users (email, password_hash, name, birth_date, gender) VALUES (?, ?, ?, ?, ?)',
                [email, 'supabase_auth_managed', 'Temp', '1900-01-01', 'M']
            );
        }

        return res.json({ success: true, message: '인증코드가 사용자의 이메일로 실제 발송되었습니다.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

/* [수정] Supabase Auth API를 사용한 인증번호 검증 */
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: '필수 항목이 누락되었습니다.' });

    try {
        // [수정] Supabase Auth API를 통해 사용자가 입력한 OTP 검증
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'signup' // 또는 'magiclink' (Supabase 설정에 따름)
        });

        if (error) {
            // 회원가입 전용 OTP가 아니라면 'magiclink' 타입으로 재시도해볼 수 있음
            const { data: retryData, error: retryError } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'magiclink'
            });

            if (retryError) {
                return res.status(400).json({ success: false, message: '인증번호가 틀렸거나 만료되었습니다.' });
            }
        }

        // 인증 성공 시 로컬 DB 업데이트
        await pool.query('UPDATE users SET email_verified = true WHERE email = ?', [email]);

        return res.json({ success: true, message: '이메일 인증이 완료되었습니다.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

/* [수정] Supabase Auth로 회원가입 최종 완료 (비밀번호 설정 등) */
exports.signup = async (req, res) => {
    const { password, name, birth_date, gender } = req.body;
    /* [수정] 회원가입 시에도 이메일 소문자화 및 공백 제거 적용 */
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : '';

    if (!email || !password || !name || !birth_date || !gender) {
        return res.status(400).json({ success: false, message: '모든 항목을 입력해주세요.' });
    }

    try {
        // 1. 기존 유저 확인 및 인증 여부 체크
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0 || !users[0].email_verified) {
            return res.status(400).json({ success: false, message: '이메일 인증을 먼저 완료해주세요.' });
        }

        // 2. Supabase Auth 비밀번호 업데이트 (이미 유저가 OTP 요청 시 생성되었다고 가정)
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            return res.status(400).json({ success: false, message: '비밀번호 설정 실패: ' + error.message });
        }

        // 3. 로컬 프로필 DB 업데이트
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

/* [수정] Supabase Auth를 사용한 로그인 */
exports.login = async (req, res) => {
    const { password } = req.body;
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : '';

    if (!email || !password) return res.status(400).json({ success: false, message: '이메일과 비밀번호를 입력해주세요.' });

    try {
        // 1. Supabase Auth 로그인 시도
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Login Failed:', error.message);
            return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 틀렸습니다.' });
        }

        // 2. 로컬 DB에서 사용자 추가 정보 로드
        const [users] = await pool.query('SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(?)', [email]);

        if (users.length === 0) {
            return res.status(400).json({ success: false, message: '사용자 프로필을 찾을 수 없습니다.' });
        }

        // 3. 기존 JWT 생성 로직 (프론트엔드 호환성을 위해 유지)
        const token = jwt.sign(
            { id: users[0].id, email: users[0].email, supabase_id: data.user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({
            success: true,
            token,
            user: {
                id: users[0].id,
                email: users[0].email,
                name: users[0].name
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
/* [수정] 회원 프로필 정보 수정 (이름, 생년월일, 성별, 전화번호) */
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
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

/* [수정] 비밀번호 변경 로직 추가 */
exports.updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        
        const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!isMatch) return res.status(401).json({ success: false, message: '현재 비밀번호가 일치하지 않습니다.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, req.user.id]);

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;

        return res.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: '서버 오류 발생' });
    }
};
