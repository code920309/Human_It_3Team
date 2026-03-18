const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../utils/authMiddleware');
const upload = require('../config/multerConfig');

router.post('/analyze', authMiddleware, upload.single('reportFile'), reportController.analyzeReport);
router.post('/save', authMiddleware, reportController.saveReport);
router.get('/years', authMiddleware, reportController.getYears);
router.get('/health', authMiddleware, reportController.getHealthReport);

module.exports = router;
