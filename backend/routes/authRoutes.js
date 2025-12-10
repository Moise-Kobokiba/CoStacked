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

// LinkedIn OAuth Routes
router.get(
  '/linkedin',
  passport.authenticate('linkedin', { scope: ['openid', 'profile', 'email'] })
);

router.get(
  '/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login', session: false }),
  oauthCallback
);

module.exports = router;
