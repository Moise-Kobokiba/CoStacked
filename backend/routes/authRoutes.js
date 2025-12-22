// backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { oauthCallback } = require('../controllers/authController');

// GitHub OAuth Routes
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/login', session: false }),
  oauthCallback
);

// Google OAuth Routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  oauthCallback
);

// Custom LinkedIn authentication using access token from environment
router.get('/linkedin', async (req, res) => {
  try {
    console.log('LinkedIn auth: Starting authentication');
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;

    if (!accessToken) {
      console.error('LinkedIn access token not configured');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=linkedin_not_configured`);
    }

    console.log('LinkedIn auth: Token found, making API call');

    // Fetch user profile from LinkedIn API
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    console.log('LinkedIn auth: API response status:', profileResponse.status);

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('LinkedIn API Error:', profileResponse.status, errorText);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=linkedin_api_error&status=${profileResponse.status}`);
    }

    const profileData = await profileResponse.json();
    console.log('LinkedIn auth: Profile data received:', JSON.stringify(profileData, null, 2));

    // Check if user already exists
    console.log('LinkedIn auth: Checking for existing user with linkedinId:', profileData.id);
    let user = await require('../models/User').findOne({ linkedinId: profileData.id });
    console.log('LinkedIn auth: Existing user found:', !!user);

    if (!user) {
      // Create new user
      console.log('LinkedIn auth: Creating new user');
      const User = require('../models/User');
      const newUserData = {
        name: `${profileData.localizedFirstName || profileData.firstName || 'User'} ${profileData.localizedLastName || profileData.lastName || ''}`.trim(),
        email: `${profileData.id}@linkedin.oauth`,
        linkedinId: profileData.id,
        role: 'developer',
        isEmailVerified: false,
        avatarUrl: profileData.profilePicture?.displayImage || '',
      };

      console.log('LinkedIn auth: User data to create:', JSON.stringify(newUserData, null, 2));
      user = await User.create(newUserData);
      console.log('LinkedIn auth: User created successfully:', user._id);
    }

    // Generate JWT token
    console.log('LinkedIn auth: Generating JWT token');
    const generateToken = require('../utils/generateToken');
    const token = generateToken(user._id);
    console.log('LinkedIn auth: Token generated, redirecting to frontend');

    // Redirect to frontend with token
    const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);

  } catch (error) {
    console.error('Custom LinkedIn Auth Error:', error);
    console.error('Error stack:', error.stack);
    const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    res.redirect(`${FRONTEND_URL}/login?error=server_error&message=${encodeURIComponent(error.message)}`);
  }
});

router.get(
  '/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login', session: false }),
  oauthCallback
);



module.exports = router;
