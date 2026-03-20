const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../utils/authMiddleware');
const upload = require('../config/multerConfig');

/* MERGED FROM 업로드OCR: 게스트 분석 라우트 추가 */

const rateLimit = require('express-rate-limit');

/* 
 * [최적화] 비회원 API 호출량 제한 (Rate Limiting)
 * 대표님, 무분별한 API 호출로 인한 비용 발생 및 서버 부하를 방지하기 위해 
 * 동일 IP당 1시간에 최대 5번까지만 비회원 분석이 가능하도록 제한을 걸었습니다.
 */
const guestAnalyzeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1시간
    max: 5, // 최대 5회
    message: {
        success: false,
        message: '너무 많은 요청을 보냈습니다. 기회는 시간당 5번입니다. 잠시 후 다시 시도해주세요.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/analyze', authMiddleware, upload.single('reportFile'), reportController.analyzeReport);
router.post('/analyze-guest', guestAnalyzeLimiter, upload.single('reportFile'), reportController.analyzeGuestReport);
router.post('/save', authMiddleware, reportController.saveReport);
router.get('/years', authMiddleware, reportController.getYears);
router.get('/health', authMiddleware, reportController.getHealthReport);

module.exports = router;
