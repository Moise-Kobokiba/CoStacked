// backend/models/TempRegistration.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const tempRegistrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  bio: String,
  skills: [String],
  location: String,
  availability: String,
  portfolioLink: String,
  verificationToken: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => Date.now() + 10 * 60 * 1000, // 10 minutes
  },
}, {
  timestamps: true,
});

// Middleware to automatically hash the password before saving
tempRegistrationSchema.pre("save", async function (next) {
  console.log("🔐 TempRegistration pre-save hook triggered for:", this.email);
  if (!this.isModified("password")) {
    console.log("   Password not modified, skipping hash");
    return next();
  }
  try {
    console.log("   Hashing password...");
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("   Password hashed successfully");
    next();
  } catch (error) {
    console.error("❌ Password hashing failed:", error.message);
    next(error);
  }
});

// Index to automatically delete expired documents
tempRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TempRegistration', tempRegistrationSchema);