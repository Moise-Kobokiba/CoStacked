// backend/controllers/authController.js

const generateToken = require('../utils/generateToken');
const { sendVerificationEmail } = require('../mailer');
const User = require('../models/User'); // adjust path to your User model

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

    // Generate JWT token
    const token = generateToken(req.user._id);

    // Check if user is new / not verified
    const user = await User.findById(req.user._id);

    if (!user.isVerified) {
      // Optional: mark them as verified immediately or keep separate verification flow
      user.isVerified = true;
      await user.save();

      // Generate a verification/welcome link (could be the same token)
      const verificationLink = `${FRONTEND_URL}/verify?token=${token}`;

      // Send welcome/verification email
      await sendVerificationEmail(user.email, verificationLink);
    }

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