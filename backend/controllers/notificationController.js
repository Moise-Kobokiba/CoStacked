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
      .populate('sender', 'name avatarUrl headline')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching notifications.' });
  }
};

/**
 * @desc    Mark all notifications as read
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name avatarUrl headline')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ recipient: req.user._id });

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching notification history.' });
  }
};

/**
 * @desc    Delete a single notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this notification' });
    }

    await notification.deleteOne();

    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting notification.' });
  }
};

/**
 * @desc    Clear all notifications for the logged-in user
 * @route   DELETE /api/notifications
 * @access  Private
 */
const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    res.json({ success: true, message: 'All notifications cleared.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error clearing notifications.' });
  }
};

/**
 * @desc    Mark a single notification as read or unread
 * @route   PUT /api/notifications/:id/toggle-read
 * @access  Private
 */
const toggleReadNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    notification.isRead = !notification.isRead;
    notification.read = notification.isRead;
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating notification.' });
  }
};

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getNotifications,
  getAllNotifications,
  markAsRead,
  deleteNotification,
  clearAllNotifications,
  toggleReadNotification,
  getUnreadCount,
};