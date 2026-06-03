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
  (req, res, next) => {
    const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        console.error('Google OAuth Error:', err);
        return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
      }
      
      // Check if user doesn't exist (account_not_found)
      if (!user && info && info.message === 'account_not_found') {
        console.log('Google OAuth: Account not found, redirecting to signup');
        return res.redirect(`${FRONTEND_URL}/signup?error=account_not_found&provider=google`);
      }
      
      if (!user) {
        return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
      }
      
      // Attach user to request for oauthCallback
      req.user = user;
      next();
    })(req, res, next);
  },
  oauthCallback
);

// LinkedIn OAuth with proper OpenID Connect scopes
router.get(
  '/linkedin',
  passport.authenticate('linkedin', {
    scope: ['openid', 'profile'],
    state: true
  })
);

router.get(
  '/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login', session: false }),
  oauthCallback
);

router.get(
  '/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login', session: false }),
  oauthCallback
);



module.exports = router;
