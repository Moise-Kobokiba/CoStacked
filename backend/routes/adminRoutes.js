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