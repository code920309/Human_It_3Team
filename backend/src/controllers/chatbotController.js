const pool = require('../config/db');
const geminiService = require('../services/geminiService');

exports.sendMessage = async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: '메시지를 입력해주세요.' });

    try {
        // 1. Get latest health data for context (Optional)
        const [healthRows] = await pool.query(
            'SELECT * FROM health_data WHERE user_id = ? ORDER BY exam_year DESC LIMIT 1',
            [req.user.id]
        );
        
        // Context object construction
        const healthContext = healthRows.length > 0 ? healthRows[0] : { 
            waist: '없음', blood_pressure_s: '없음', blood_pressure_d: '없음', 
            fasting_glucose: '없음', hdl: '없음', ldl: '없음', tg: '없음', 
            ast: '없음', alt: '없음', gamma_gtp: '없음', bmi: '없음', health_score: '없음' 
        };

        // 2. Get chat history (last 10 messages)
        const [historyRows] = await pool.query(
            'SELECT role, message FROM chatbot_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
            [req.user.id]
        );
        const history = historyRows.reverse();

        // 3. Get AI Response
        const aiResponse = await geminiService.chatHealthConsultation(history, message, healthContext);

        // 4. Save to DB
        await pool.query('INSERT INTO chatbot_history (user_id, role, message) VALUES (?, ?, ?)', [req.user.id, 'user', message]);
        await pool.query('INSERT INTO chatbot_history (user_id, role, message) VALUES (?, ?, ?)', [req.user.id, 'assistant', aiResponse]);

        return res.json({
            success: true,
            data: { aiResponse }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: '챗봇 응답 중 오류가 발생했습니다.' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT role, message, created_at FROM chatbot_history WHERE user_id = ? ORDER BY created_at ASC',
            [req.user.id]
        );
        return res.json({
            success: true,
            data: rows
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: '대화 기록 조회 중 오류가 발생했습니다.' });
    }
};
