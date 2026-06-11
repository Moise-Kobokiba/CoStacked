// backend/controllers/authController.js

const generateToken = require('../utils/generateToken');
const { sendVerificationEmail } = require('../utils/sendEmail');

/**
 * @desc    Handle OAuth callback success
 * @route   GET /api/auth/:provider/callback
 * @access  Public (via Passport)
 */
const oauthCallback = async (req, res) => {
  const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  
  try {
    if (!req.user) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }

    // Mark user as online and update last active timestamp
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    
    if (user) {
      user.isOnline = true;
      user.lastActiveAt = new Date();
      if (!user.isVerified) {
        user.isVerified = true;
        // Send welcome/verification email
        const token = generateToken(user._id);
        const verificationLink = `${FRONTEND_URL}/verify?token=${token}`;
        await sendVerificationEmail(user.email, verificationLink);
      }
      await user.save({ validateBeforeSave: false });
    }

    // Generate JWT token
    const token = generateToken(req.user._id);

    // Redirect to frontend with token
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    res.redirect(`${FRONTEND_URL}/login?error=server_error`);
  }
};

module.exports = {
  oauthCallback,
};