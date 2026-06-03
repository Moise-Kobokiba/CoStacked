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
   socials: {
     twitter: { type: String, default: '' },
     linkedin: { type: String, default: '' },
     instagram: { type: String, default: '' },
     facebook: { type: String, default: '' },
     tiktok: { type: String, default: '' },
   },
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
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Index to automatically delete expired documents
tempRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TempRegistration', tempRegistrationSchema);