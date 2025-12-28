// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();

// 1. Import ALL THREE controller functions from the paymentController
const { 
  verifyPaymentAndBoost, 
  verifySubscription,
  verifyProfileBoost, // <-- Import the new function
  cancelSubscription,
  createCheckoutSession
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/payments/verify
 * @desc    Verify a payment for boosting a specific project.
 * @access  Private
 */
router.route('/verify').post(protect, verifyPaymentAndBoost);

/**
 * @route   POST /api/payments/verify-subscription
 * @desc    Verify a payment for a user's verification subscription.
 * @access  Private
 */
router.route('/verify-subscription').post(protect, verifySubscription);

/**
 * @route   POST /api/payments/verify-profile-boost
 * @desc    Verify a payment for boosting a user's own profile.
 * @access  Private
 */
router.route('/verify-profile-boost').post(protect, verifyProfileBoost); // <-- 2. ADD THIS ROUTE

/**
 * @route   POST /api/payments/cancel-subscription
 * @desc    Cancel user's subscription auto-renewal
 * @access  Private
 */
router.route('/cancel-subscription').post(protect, cancelSubscription);

/**
 * @route   POST /api/payments/checkout
 * @desc    Create a Yoco checkout session
 * @access  Private
 */
router.route('/checkout').post(protect, createCheckoutSession);

/**
 * @route   POST /api/payments/verify-checkout
 * @desc    Verify a Yoco checkout session
 * @access  Private
 */
router.route('/verify-checkout').post(protect, verifyCheckout);

module.exports = router;
```