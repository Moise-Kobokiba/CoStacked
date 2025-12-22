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

// Custom LinkedIn authentication using provided access token
router.get('/linkedin', async (req, res) => {
  try {
    const accessToken = 'AQXTCgKpGrvuGU9SlZDrsTqPOyLsgf7e91Qu1Y65QnbFkv-2w9hftb_cGS873J0_zfIKni6SoEkQmhmorRfV6sdj1EVRNsir-szYNXG8aCRGU5PZrqJWkchSuHc3S98z_ywjGxLM-_3iSJh3lrEX0LBHVmqt7YUh8rQjUFDT7D7fTlk-LeOE0g5h8-QPr7fwRPDHQhdyxswiD6wSHEg3SChzxjGbRvx9DACRBFKjH3odlCWc-rN93SEpINprN5H8kYZVH4TAjj2NqJb1VPwTccwTr28xsQ1UXlIAUYEfaMd7knkQu3tU7mTHmgVqxfR0BFLKb9Tr20Q7PmBRMVsqryZE70-hgw';

    // Fetch user profile from LinkedIn API
    const profileResponse = await fetch('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    if (!profileResponse.ok) {
      console.error('LinkedIn API Error:', profileResponse.status, await profileResponse.text());
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=linkedin_api_error`);
    }

    const profileData = await profileResponse.json();

    // Check if user already exists
    let user = await require('../models/User').findOne({ linkedinId: profileData.id });

    if (!user) {
      // Create new user
      const User = require('../models/User');
      const newUserData = {
        name: `${profileData.firstName?.localized?.en_US || profileData.firstName?.localized?.en || 'User'} ${profileData.lastName?.localized?.en_US || profileData.lastName?.localized?.en || ''}`.trim(),
        email: `${profileData.id}@linkedin.oauth`,
        linkedinId: profileData.id,
        role: 'developer',
        isEmailVerified: false,
        avatarUrl: profileData.profilePicture?.displayImage || '',
      };

      user = await User.create(newUserData);
    }

    // Generate JWT token
    const generateToken = require('../utils/generateToken');
    const token = generateToken(user._id);

    // Redirect to frontend with token
    const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);

  } catch (error) {
    console.error('Custom LinkedIn Auth Error:', error);
    const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    res.redirect(`${FRONTEND_URL}/login?error=server_error`);
  }
});

router.get(
  '/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login', session: false }),
  oauthCallback
);



module.exports = router;
