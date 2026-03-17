const pool = require('../config/db');
const geminiService = require('../services/geminiService');

exports.getCurrentPlan = async (req, res) => {
    try {
        // 1. Get latest health data & report
        const [healthRows] = await pool.query(
            'SELECT hd.*, ar.summary FROM health_data hd LEFT JOIN ai_reports ar ON hd.id = ar.health_data_id WHERE hd.user_id = ? ORDER BY hd.exam_year DESC LIMIT 1',
            [req.user.id]
        );

        if (healthRows.length === 0) {
            return res.status(404).json({ success: false, message: '분석된 데이터가 없습니다.' });
        }

        const latestHealthData = healthRows[0];

        // 2. Check if plan already exists for this health_data_id
        const [planRows] = await pool.query(
            'SELECT * FROM action_plans WHERE user_id = ? AND health_data_id = ?',
            [req.user.id, latestHealthData.id]
        );

        if (planRows.length > 0) {
            return res.json({
                success: true,
                data: planRows
            });
        }

        // 3. If not, generate new plan
        const generated = await geminiService.generateActionPlan(latestHealthData);
        
        const insertPromises = generated.plans.map(plan => {
            return pool.query(
                'INSERT INTO action_plans (user_id, health_data_id, category, title, content, difficulty) VALUES (?, ?, ?, ?, ?, ?)',
                [req.user.id, latestHealthData.id, plan.category, plan.title, plan.content, plan.difficulty]
            );
        });

        await Promise.all(insertPromises);

        const [newPlanRows] = await pool.query(
            'SELECT * FROM action_plans WHERE user_id = ? AND health_data_id = ?',
            [req.user.id, latestHealthData.id]
        );

        return res.json({
            success: true,
            data: newPlanRows
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: '액션 플랜 생성 중 오류가 발생했습니다.' });
    }
};

exports.toggleComplete = async (req, res) => {
    const { id } = req.params;
    const { is_completed } = req.body;

    try {
        await pool.query(
            'UPDATE action_plans SET is_completed = ? WHERE id = ? AND user_id = ?',
            [is_completed ? true : false, id, req.user.id]
        );
        return res.json({ success: true, message: '업데이트 성공' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: '업데이트 실패' });
    }
};
