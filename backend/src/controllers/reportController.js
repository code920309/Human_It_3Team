const pool = require('../config/db');
const geminiService = require('../services/geminiService');
const fs = require('fs');

exports.analyzeReport = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
    }
    try {
        const [users] = await pool.query('SELECT birth_date, gender FROM users WHERE id = ?', [req.user.id]);
        const user = users[0];
        const age = new Date().getFullYear() - new Date(user.birth_date).getFullYear();

        const analysisResults = await geminiService.analyzeHealthReport(
            req.file.path || req.file.buffer,
            req.file.mimetype,
            { age, gender: user.gender }
        );

        return res.json({
            success: true,
            message: '리포트 분석이 완료되었습니다.',
            data: analysisResults
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'AI 분석 중 오류가 발생했습니다.', error: err.message, stack: err.stack });
    }
};

exports.saveReport = async (req, res) => {
    const { year, healthRecord, aiReport } = req.body;
    if (!year || !healthRecord) {
        return res.status(400).json({ success: false, message: '다시 리뷰 후 저장해주세요.' });
    }

    try {
        const [existingData] = await pool.query(
            'SELECT id FROM health_data WHERE user_id = ? AND exam_year = ?',
            [req.user.id, year]
        );

        let healthDataId;
        const healthDataFields = {
            user_id: req.user.id,
            exam_year: year,
            waist: healthRecord.waist,
            blood_pressure_s: healthRecord.bpSys,
            blood_pressure_d: healthRecord.bpDia,
            fasting_glucose: healthRecord.glucose,
            tg: healthRecord.tg,
            hdl: healthRecord.hdl,
            ldl: healthRecord.ldl,
            ast: healthRecord.ast,
            alt: healthRecord.alt,
            gamma_gtp: healthRecord.gammaGtp,
            bmi: healthRecord.bmi,
            health_score: aiReport ? aiReport.healthScore : null,
            source_type: 'manual'  // after review, we can treat it as verified or manual
        };

        if (existingData.length > 0) {
            healthDataId = existingData[0].id;
            await pool.query(
                `UPDATE health_data SET 
                    waist = ?, blood_pressure_s = ?, blood_pressure_d = ?, fasting_glucose = ?, 
                    tg = ?, hdl = ?, ldl = ?, ast = ?, alt = ?, gamma_gtp = ?, bmi = ?, 
                    health_score = ?, source_type = ? 
                WHERE id = ?`,
                [
                    healthDataFields.waist, healthDataFields.blood_pressure_s, healthDataFields.blood_pressure_d, 
                    healthDataFields.fasting_glucose, healthDataFields.tg, healthDataFields.hdl, 
                    healthDataFields.ldl, healthDataFields.ast, healthDataFields.alt, 
                    healthDataFields.gamma_gtp, healthDataFields.bmi, healthDataFields.health_score, 
                    healthDataFields.source_type, healthDataId
                ]
            );
        } else {
            const [result] = await pool.query(
                `INSERT INTO health_data (
                    user_id, exam_year, waist, blood_pressure_s, blood_pressure_d, fasting_glucose, 
                    tg, hdl, ldl, ast, alt, gamma_gtp, bmi, health_score, source_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    healthDataFields.user_id, healthDataFields.exam_year, healthDataFields.waist, 
                    healthDataFields.blood_pressure_s, healthDataFields.blood_pressure_d, 
                    healthDataFields.fasting_glucose, healthDataFields.tg, healthDataFields.hdl, 
                    healthDataFields.ldl, healthDataFields.ast, healthDataFields.alt, 
                    healthDataFields.gamma_gtp, healthDataFields.bmi, healthDataFields.health_score, 
                    healthDataFields.source_type
                ]
            );
            healthDataId = result.insertId || (result[0] && result[0].id);
        }

        if (aiReport) {
            const aiReportFields = {
                user_id: req.user.id,
                health_data_id: healthDataId,
                exam_year: year,
                summary: aiReport.summary,
                medical_recommendation: aiReport.medicalRecommendation,
                risk_overview: JSON.stringify(aiReport.riskOverview),
                organ_heart_status: aiReport.organStatus?.heart,
                organ_liver_status: aiReport.organStatus?.liver,
                organ_pancreas_status: aiReport.organStatus?.pancreas,
                organ_abdomen_status: aiReport.organStatus?.abdomen,
                organ_vessels_status: aiReport.organStatus?.vessels,
                analysis_precision: 100
            };

            const [existingReport] = await pool.query(
                'SELECT id FROM ai_reports WHERE user_id = ? AND exam_year = ?',
                [req.user.id, year]
            );

            if (existingReport.length > 0) {
                await pool.query(
                    `UPDATE ai_reports SET 
                        summary = ?, medical_recommendation = ?, risk_overview = ?, 
                        organ_heart_status = ?, organ_liver_status = ?, organ_pancreas_status = ?, 
                        organ_abdomen_status = ?, organ_vessels_status = ?, analysis_precision = ? 
                    WHERE id = ?`,
                    [
                        aiReportFields.summary, aiReportFields.medical_recommendation, aiReportFields.risk_overview,
                        aiReportFields.organ_heart_status, aiReportFields.organ_liver_status, aiReportFields.organ_pancreas_status,
                        aiReportFields.organ_abdomen_status, aiReportFields.organ_vessels_status, aiReportFields.analysis_precision,
                        existingReport[0].id
                    ]
                );
            } else {
                await pool.query(
                    `INSERT INTO ai_reports (
                        user_id, health_data_id, exam_year, summary, medical_recommendation, 
                        risk_overview, organ_heart_status, organ_liver_status, organ_pancreas_status, 
                        organ_abdomen_status, organ_vessels_status, analysis_precision
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        aiReportFields.user_id, aiReportFields.health_data_id, aiReportFields.exam_year, 
                        aiReportFields.summary, aiReportFields.medical_recommendation, aiReportFields.risk_overview,
                        aiReportFields.organ_heart_status, aiReportFields.organ_liver_status, aiReportFields.organ_pancreas_status,
                        aiReportFields.organ_abdomen_status, aiReportFields.organ_vessels_status, aiReportFields.analysis_precision
                    ]
                );
            }
        }

        return res.json({ success: true, message: '건강검진 데이터가 저장되었습니다.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: '데이터 저장 중 오류가 발생했습니다.' });
    }
};

exports.getYears = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT DISTINCT exam_year FROM health_data WHERE user_id = ? ORDER BY exam_year DESC',
            [req.user.id]
        );
        const availableYears = rows.map(r => r.exam_year);
        return res.json({
            success: true,
            data: {
                availableYears,
                latestYear: availableYears[0] || null
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: '연도 조회 중 오류가 발생했습니다.' });
    }
};

exports.getHealthReport = async (req, res) => {
    const { year } = req.query;
    if (!year) return res.status(400).json({ success: false, message: '연도를 지정해주세요.' });

    try {
        const [hdRows] = await pool.query(
            'SELECT * FROM health_data WHERE user_id = ? AND exam_year = ?',
            [req.user.id, year]
        );
        if (hdRows.length === 0) return res.status(404).json({ success: false, message: '해당 연도의 데이터가 없습니다.' });

        const [arRows] = await pool.query(
            'SELECT * FROM ai_reports WHERE user_id = ? AND exam_year = ?',
            [req.user.id, year]
        );

        return res.json({
            success: true,
            data: {
                healthRecord: hdRows[0],
                aiReport: arRows[0] ? {
                    ...arRows[0],
                    riskOverview: JSON.parse(arRows[0].risk_overview || '[]')
                } : null
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: '데이터 조회 중 오류가 발생했습니다.' });
    }
};
