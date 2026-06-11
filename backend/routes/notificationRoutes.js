// backend/routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  getAllNotifications, 
  markAsRead, 
  deleteNotification, 
  clearAllNotifications, 
  toggleReadNotification,
  getUnreadCount
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getNotifications)
  .delete(protect, clearAllNotifications);

router.route('/all').get(protect, getAllNotifications);
router.route('/mark-read').put(protect, markAsRead);
router.route('/unread-count').get(protect, getUnreadCount);
router.route('/:id').delete(protect, deleteNotification);
router.route('/:id/toggle-read').put(protect, toggleReadNotification);

module.exports = router;
