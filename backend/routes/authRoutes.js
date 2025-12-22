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

// Only enable LinkedIn routes if credentials are configured
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  router.get(
    '/linkedin',
    passport.authenticate('linkedin', { scope: ['r_liteprofile'], state: true })
  );

  router.get(
    '/linkedin/callback',
    passport.authenticate('linkedin', { failureRedirect: '/login', session: false }),
    oauthCallback
  );
}

router.get(
  '/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login', session: false }),
  oauthCallback
);

// Test endpoint to verify LinkedIn API access with provided token
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  router.get('/linkedin/test', async (req, res) => {
    try {
      const accessToken = 'AQXTCgKpGrvuGU9SlZDrsTqPOyLsgf7e91Qu1Y65QnbFkv-2w9hftb_cGS873J0_zfIKni6SoEkQmhmorRfV6sdj1EVRNsir-szYNXG8aCRGU5PZrqJWkchSuHc3S98z_ywjGxLM-_3iSJh3lrEX0LBHVmqt7YUh8rQjUFDT7D7fTlk-LeOE0g5h8-QPr7fwRPDHQhdyxswiD6wSHEg3SChzxjGbRvx9DACRBFKjH3odlCWc-rN93SEpINprN5H8kYZVH4TAjj2NqJb1VPwTccwTr28xsQ1UXlIAUYEfaMd7knkQu3tU7mTHmgVqxfR0BFLKb9Tr20Q7PmBRMVsqryZE70-hgw';

      // Test LinkedIn API with the provided access token
      const profileResponse = await fetch('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      if (!profileResponse.ok) {
        return res.status(profileResponse.status).json({
          error: 'LinkedIn API Error',
          status: profileResponse.status,
          details: await profileResponse.text()
        });
      }

      const profileData = await profileResponse.json();

      res.json({
        success: true,
        message: 'LinkedIn API access successful',
        profile: profileData
      });

    } catch (error) {
      console.error('LinkedIn API Test Error:', error);
      res.status(500).json({
        error: 'Server error testing LinkedIn API',
        details: error.message
      });
    }
  });
}

module.exports = router;
