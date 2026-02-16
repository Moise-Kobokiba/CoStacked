// backend/models/User.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false, // Optional for OAuth users
    },
    
    // --- OAuth Provider IDs ---
    githubId: { type: String, unique: true, sparse: true },
    googleId: { type: String, unique: true, sparse: true },
    linkedinId: { type: String, unique: true, sparse: true },
    
    role: { 
      type: String, 
      required: true, 
      enum: ['developer', 'founder', 'admin'],
      default: 'developer',
    },

    // --- Security & Status Fields ---
    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isBoosted: { type: Boolean, default: false },
    boostExpiresAt: { type: Date },
    isEmailVerified: { type: Boolean, default: false },
    
    // --- Token Fields ---
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },

    // --- Subscription Fields ---
    subscriptionExpiresAt: { type: Date },
    isSubscriptionAutoRenew: { type: Boolean, default: false },

    // --- Optional Profile Fields ---
    bio: { type: String, default: "" },
    skills: { type: [String], default: [] },
    availability: { type: String, default: "" },
    location: { type: String, default: "" },
    portfolioLink: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },

    // --- User Preference Fields ---
    profileVisibility: { type: String, enum: ["public", "connections-only"], default: "public" },
    notificationEmails: { type: String, enum: ["all", "essential", "none"], default: "essential" },
    profileViews: { type: Number, default: 0 },
    
    // --- THIS IS THE FIX ---
    // The connection fields have been moved inside the schema definition object.
    // The syntax for an array of ObjectIds has also been corrected.
    connections: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }],
    sentConnections: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }],
    receivedConnections: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }],

    // --- NEW: Social Media Links Object ---
    socials: {
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      tiktok: { type: String, default: '' },
    },

    // --- Profile Completion Tracking ---
    profileCompleted: { type: Boolean, default: false },

  },
  {
    timestamps: true,
  }
);

// Middleware to automatically hash the user's password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.password.startsWith('$2b$')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Validation middleware to ensure admin users have verified emails
userSchema.pre("save", function (next) {
  // Only validate if this is a new document or if isAdmin field is being modified
  if (this.isNew || this.isModified('isAdmin')) {
    if (this.isAdmin === true && this.isEmailVerified !== true) {
      console.log('User validation - Admin user without verified email:', {
        isAdmin: this.isAdmin,
        isEmailVerified: this.isEmailVerified,
        isNew: this.isNew
      });
      const error = new Error("Admin users must have verified email addresses");
      return next(error);
    }
  }
  next();
});

// Method to securely compare a provided password with the hashed password in the DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate and hash password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);