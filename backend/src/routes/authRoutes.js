const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../utils/authMiddleware');

// [Public Auth Routes]
router.post('/signup/request-otp', authController.requestOTP);
router.post('/signup/verify-otp', authController.verifyOTP);
router.post('/signup', authController.signup); // signup으로 통일
router.post('/login', authController.login);
router.post('/refresh', authController.refresh); // 토큰 자동 갱신용
router.post('/logout', authController.logout);   // 보안 로그아웃

// [Private Auth Routes]
router.get('/me', authMiddleware, authController.getMe);
/* [수정] 회원 프로필 수정 API 엔드포인트 추가 */
router.put('/update-profile', authMiddleware, authController.updateProfile);
/* [수정] 비밀번호 변경 API 엔드포인트 추가 */
router.put('/update-password', authMiddleware, authController.updatePassword);

module.exports = router;
