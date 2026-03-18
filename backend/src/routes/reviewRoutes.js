const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// [GET] 공개된 최신 리뷰 4개 가져오기
router.get('/public', reviewController.getPublicReviews);

// [GET] 리뷰 작성 여부 확인 (예: /api/reviews/check?email=test@test.com)
router.get('/check', reviewController.checkReviewStatus);

// [POST] 백엔드 DB로 리뷰 데이터 전송 및 저장 (예: /api/reviews)
router.post('/', reviewController.submitReview);

module.exports = router;
