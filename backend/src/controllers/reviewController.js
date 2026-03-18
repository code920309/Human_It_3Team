const { query } = require('../config/db');

exports.checkReviewStatus = async (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ success: false, message: '이메일 정보가 제공되지 않았습니다.' });
    }

    try {
        // 1. 전달받은 이메일로 users 테이블에서 고유 user_id 찾기
        const [users] = await query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }
        
        const userId = users[0].id;

        // 2. 해당 유저가 작성한 리뷰가 reviews 테이블에 있는지 확인
        const [reviews] = await query('SELECT * FROM reviews WHERE user_id = ?', [userId]);

        // 리뷰 데이터 배열이 0보다 크면 true (이미 작성함), 아니면 false (미작성)
        const hasReviewed = reviews.length > 0;
        
        return res.json({ success: true, hasReviewed });
    } catch (error) {
        console.error('리뷰 상태 확인 서버 에러 발생(DB 연동):', error);
        return res.status(500).json({ success: false, message: '서버 에러가 발생했습니다.' });
    }
};

exports.submitReview = async (req, res) => {
    const { email, rating, review_text } = req.body;

    if (!email || !rating || !review_text) {
        return res.status(400).json({ success: false, message: '필수 항목이 누락되었습니다.' });
    }

    try {
        // 1. 전달받은 이메일로 users 테이블에서 고유 user_id 찾기
        const [users] = await query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }
        
        const userId = users[0].id;

        // 2. reviews 테이블에 리뷰 등록 (is_public 값은 추후 기획에 따라 변경될 수 있도록 기본값 FALSE로 저장됨)
        const [result] = await query(
            'INSERT INTO reviews (user_id, rating, content) VALUES (?, ?, ?)',
            [userId, rating, review_text]
        );

        return res.status(201).json({ success: true, message: '소중한 리뷰가 데이터베이스에 성공적으로 저장되었습니다.' });
    } catch (error) {
        console.error('리뷰 등록 서버 에러 발생(DB 연동):', error);
        return res.status(500).json({ success: false, message: '서버 에러가 발생했습니다.' });
    }
};

// 홈페이지에 노출할 승인된 리뷰 4개 가져오기
exports.getPublicReviews = async (req, res) => {
    try {
        const [reviews] = await query(
            'SELECT rating, content, created_at FROM reviews WHERE is_public = TRUE ORDER BY created_at DESC LIMIT 4'
        );
        return res.json({ success: true, reviews });
    } catch (error) {
        console.error('공개 리뷰 조회 에러 발생:', error);
        return res.status(500).json({ success: false, message: '서버 에러가 발생했습니다.' });
    }
};
