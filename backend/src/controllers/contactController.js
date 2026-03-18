const { query } = require('../config/db'); // ✅ 구조 분해 할당으로 팀의 커스텀 query 함수만 쏙 뽑아옵니다.

exports.submitContact = async (req, res) => {
    const { email, message } = req.body;

    try {
        // ✅ pool.execute 대신 query 함수를 사용합니다.
        const [result] = await query(
            'INSERT INTO contacts (email, message) VALUES (?, ?)',
            [email, message]
        );
        res.status(201).json({ success: true, message: 'Contact submitted successfully', id: result.insertId });
    } catch (error) {
        console.error('Contact submission error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit contact' });
    }
};