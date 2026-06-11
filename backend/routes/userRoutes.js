// backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const upload = require('../config/cloudinary');

// 1. Import all necessary controller functions, including the new verifyEmail
const { 
  registerUser, 
  verifyEmail,
  resendVerificationEmail,
  authUser, 
  getUsers,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  recordProfileView,
  forgotPassword,
  resetPassword,
  cancelSubscription,
  updateUserAvatar,
  deleteUserAccount,
  completeProfile,
  toggleBookmark,
  getProfileViews,
  getResponseRate
} = require('../controllers/userController');

const { protect, trackActivity } = require('../middleware/authMiddleware');


// === PUBLIC ROUTES ===
// These routes do not require a token.
router.route('/').get(getUsers);
router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword); // <-- ADD
router.put('/reset-password/:token', resetPassword);
router.route('/cancel-subscription').put(protect, cancelSubscription); 
router.route('/profile/avatar').put(protect, upload.single('avatar'), updateUserAvatar);

// === PROTECTED ROUTES ===
router.put('/reset-password/:token', resetPassword);
router.route('/cancel-subscription').put(protect, cancelSubscription); 
router.route('/profile/avatar').put(protect, upload.single('avatar'), updateUserAvatar);

// === PROTECTED ROUTES ===
// These routes require a valid token (the 'protect' middleware).
// Grouping profile-related routes together.
  router
  .route('/profile')
  .get(protect, trackActivity, getUserProfile)
  .put(protect, trackActivity, updateUserProfile)
  .delete(protect, deleteUserAccount);

router.route('/profile/bookmarks').put(protect, toggleBookmark);
router.route('/profile/change-password').put(protect, changeUserPassword);
router.route('/complete-profile').put(protect, completeProfile);
router.route('/profile/views').get(protect, getProfileViews);

// === PRESENCE ROUTE ===
// Heartbeat endpoint - authenticated users ping this to signal they are active
// Must be placed BEFORE dynamic ':id' routes to avoid conflicts
router.post('/heartbeat', protect, trackActivity, (req, res) => {
  res.json({ 
    success: true, 
    isOnline: true, 
    lastActiveAt: req.user.lastActiveAt || new Date() 
  });
});

// Dynamic routes like ':id' should be placed last to avoid conflicts
// with static routes like '/profile'.
router.route('/:id/response-rate').get(getResponseRate);
router.route('/:id/view').put(protect, trackActivity, recordProfileView);


module.exports = router;