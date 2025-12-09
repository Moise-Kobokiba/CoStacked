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
      scope: ['user:email'], // Request email access
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
            // Link GitHub account to existing user and update profile data
            user.githubId = profile.id;
            
            // Update avatar if user doesn't have one
            if (!user.avatarUrl && profile.photos && profile.photos[0]) {
              user.avatarUrl = profile.photos[0].value;
            }
            
            // Update bio if user doesn't have one and GitHub has it
            if (!user.bio && profile._json.bio) {
              user.bio = profile._json.bio;
            }
            
            // Update location if user doesn't have one and GitHub has it
            if (!user.location && profile._json.location) {
              user.location = profile._json.location;
            }
            
            await user.save();
            return done(null, user);
          }
        }

        // Create new user with GitHub data
        const newUserData = {
          name: profile.displayName || profile.username,
          email: email || `${profile.username}@github.oauth`,
          githubId: profile.id,
          role: 'developer',
          isEmailVerified: !!email, // Only mark as verified if we got a real email
          avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
        };
        
        // Add GitHub profile data if available
        if (profile._json.bio) {
          newUserData.bio = profile._json.bio;
        }
        if (profile._json.location) {
          newUserData.location = profile._json.location;
        }
        if (profile._json.blog) {
          newUserData.portfolioLink = profile._json.blog;
        }
        
        user = await User.create(newUserData);

        done(null, user);
      } catch (error) {
        console.error('GitHub OAuth Error:', error);
        done(error, null);
      }
    }
  )
);

module.exports = passport;
