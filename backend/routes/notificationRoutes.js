// backend/routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const { getNotifications, getAllNotifications, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getNotifications);
router.route('/all').get(protect, getAllNotifications);
router.route('/mark-read').put(protect, markAsRead);

module.exports = router;