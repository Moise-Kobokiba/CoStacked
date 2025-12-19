// backend/routes/adminRoutes.js

const express = require('express');
const router = express.Router();

// 1. Import all necessary controller functions, including the new login and notification ones.
const {
    loginAdmin, // <-- IMPORT THE NEW LOGIN CONTROLLER
    getPlatformStats,
    registerAdmin,
    getUsersForAdmin,
    deleteUserByAdmin,
    updateUserByAdmin,
    getProjectsForAdmin,
    updateProjectByAdmin,
    deleteProjectByAdmin,
    getReports,
    getTransactions,
    getAdminNotifications,
    markAdminNotificationsAsRead,
    updateReportStatus,
      getAdminProfile,
    forgotAdminPassword
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// === Auth Routes (Public) ===
router.route('/login').post(loginAdmin); // <-- ADD THE LOGIN ROUTE HERE
router.route('/register').post(registerAdmin); // Note: This should probably be protected
router.route('/forgot-password').post(forgotAdminPassword);

// Test email endpoint
router.route('/test-email').post(async (req, res) => {
  try {
    const { sendEmail } = require('../utils/sendEmail');
    await sendEmail({
      to: req.body.email,
      subject: 'Test Email from CoStacked',
      text: 'This is a test email to verify email functionality.',
      html: '<p>This is a test email to verify email functionality.</p>',
    });
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send test email', error: error.message });
  }
});

// Check email configuration
router.route('/email-config').get((req, res) => {
  const config = {
    hasApiKey: !!process.env.AHASEND_API_KEY,
    hasFromEmail: !!process.env.AHASEND_FROM_EMAIL,
    fromEmail: process.env.AHASEND_FROM_EMAIL,
    fromName: process.env.AHASEND_FROM_NAME || 'CoStacked',
    adminFrontendUrl: process.env.ADMIN_FRONTEND_URL,
    frontendUrl: process.env.FRONTEND_URL,
  };
  res.json(config);
});

// === Dashboard & Protected Routes ===
router.route('/stats').get(protect, admin, getPlatformStats);

// === Reports Routes ===
router.route('/reports')
  .get(protect, admin, getReports);
router.route('/reports/:id')
  .put(protect, admin, updateReportStatus);
  
// === Transactions Route ===
router.route('/transactions').get(protect, admin, getTransactions);

// === Admin Notifications Routes ===
router.route('/notifications').get(protect, admin, getAdminNotifications);
router.route('/notifications/mark-read').put(protect, admin, markAdminNotificationsAsRead);
router.route('/profile').get(protect, admin, getAdminProfile);

// === User Management Routes ===
router.route('/users').get(protect, admin, getUsersForAdmin);
router
  .route('/users/:id')
  .put(protect, admin, updateUserByAdmin)
  .delete(protect, admin, deleteUserByAdmin);

// === Project Management Routes ===
router.route('/projects').get(protect, admin, getProjectsForAdmin);
router
  .route('/projects/:id')
  .put(protect, admin, updateProjectByAdmin)
  .delete(protect, admin, deleteProjectByAdmin);

module.exports = router;