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
  toggleBookmark
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');


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
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile)
  .delete(protect, deleteUserAccount);

router.route('/profile/bookmarks').put(protect, toggleBookmark);
router.route('/profile/change-password').put(protect, changeUserPassword);
router.route('/complete-profile').put(protect, completeProfile);
router.route('/profile/views').get(protect, getProfileViews);

// Dynamic routes like ':id' should be placed last to avoid conflicts
// with static routes like '/profile'.
router.route('/:id/view').put(protect, recordProfileView);


module.exports = router;