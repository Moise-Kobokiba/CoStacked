// backend/controllers/authController.js

const generateToken = require('../utils/generateToken');
const { sendVerificationEmail } = require('../utils/sendEmail');
const User = require('../models/User'); // Import User model

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
      // Optional: mark them as verified immediately
      user.isVerified = true;
      await user.save();

      // Send welcome/verification email
      const verificationLink = `${FRONTEND_URL}/verify?token=${token}`;
      try {
        await sendVerificationEmail(user.email, verificationLink);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Continue even if email fails
      }
    }

    // Check for "new user" status - we can infer this if they are missing key fields 
    // OR we could check createdAt time, but let's check for missing fields as that's the goal.
    // However, the user asked for "new user" specifically.
    // Best proxy for "new user" in this context without a dedicated flag is 
    // if they were created within the last minute OR if they are missing required fields.
    // Let's use a combination: if their profile is incomplete, treat them as "new" for onboarding purposes.
    
    // Actually, checking if created recently is safer to determine "newness" for the WELCOME flow.
    // But checking for missing details ensures we always catch the case.
    
    const isNewUser = (Date.now() - new Date(user.createdAt).getTime()) < 60000; // Created in last minute
    const isProfileIncomplete = !user.location || !user.skills || user.skills.length === 0;

    // Redirect to frontend with token and new user flag
    // We send isNewUser=true if they are genuinely new OR if we want to force onboarding
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&isNewUser=${isNewUser || isProfileIncomplete}`);

  } catch (error) {
    console.error('OAuth Callback Error:', error);
    res.redirect(`${FRONTEND_URL}/login?error=server_error`);
  }
};

module.exports = {
  oauthCallback,
};