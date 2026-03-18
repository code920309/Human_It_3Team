const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../utils/authMiddleware');

router.post('/signup/request-otp', authController.requestOTP);
router.post('/signup/verify-otp', authController.verifyOTP);
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
/* [수정] 회원 프로필 수정 API 엔드포인트 추가 */
router.put('/update-profile', authMiddleware, authController.updateProfile);
/* [수정] 비밀번호 변경 API 엔드포인트 추가 */
router.put('/update-password', authMiddleware, authController.updatePassword);

module.exports = router;
