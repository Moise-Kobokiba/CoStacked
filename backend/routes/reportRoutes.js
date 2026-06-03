// backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { createReport, getMyReports, addReportMessage } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createReport);
router.route('/my-reports').get(protect, getMyReports);
router.route('/:id/messages').post(protect, addReportMessage);

module.exports = router;