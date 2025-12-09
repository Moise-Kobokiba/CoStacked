// backend/config/passport.js

const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/github/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this GitHub ID
        let user = await User.findOne({ githubId: profile.id });

        if (user) {
          // User exists, return it
          return done(null, user);
        }

        // Check if user exists with the same email
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            // Link GitHub account to existing user
            user.githubId = profile.id;
            await user.save();
            return done(null, user);
          }
        }

        // Create new user
        user = await User.create({
          name: profile.displayName || profile.username,
          email: email || `${profile.username}@github.oauth`,
          githubId: profile.id,
          role: 'developer', // Default role for OAuth users
          isEmailVerified: true, // OAuth emails are pre-verified
          avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
        });

        done(null, user);
      } catch (error) {
        console.error('GitHub OAuth Error:', error);
        done(error, null);
      }
    }
  )
);

module.exports = passport;
