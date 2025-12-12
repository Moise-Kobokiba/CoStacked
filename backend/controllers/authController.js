// backend/controllers/authController.js

const generateToken = require('../utils/generateToken');

/**
 * @desc    Handle OAuth callback success
 * @route   GET /api/auth/:provider/callback
 * @access  Public (via Passport)
 */
const oauthCallback = (req, res) => {
  const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  try {
    // req.user is set by Passport after successful authentication
    if (!req.user) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
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
