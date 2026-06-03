// backend/controllers/notificationController.js

const Notification = require('../models/Notification');

/**
 * @desc    Get all unread notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id, isRead: false })
      .populate('sender', 'name avatarUrl')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching notifications.' });
  }
};

/**
 * @desc    Mark notifications as read
 * @route   PUT /api/notifications/mark-read
 * @access  Private
 */
const markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true, message: 'Notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating notifications.' });
  }
};

/**
 * @desc    Get all notifications (read and unread) for the logged-in user
 * @route   GET /api/notifications/all
 * @access  Private
 */
const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name avatarUrl')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 })
      .limit(50); 
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching notification history.' });
  }
};

module.exports = { getNotifications, getAllNotifications, markAsRead };