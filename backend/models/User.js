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

    // --- Optional Profile Fields ---
    bio: { type: String, default: "" },
    skills: { type: [String], default: [] },
    availability: { type: String, default: "" },
    location: { type: String, default: "" },
    portfolioLink: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },

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

  },
  {
    timestamps: true,
  }
);

// Middleware to automatically hash the user's password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
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