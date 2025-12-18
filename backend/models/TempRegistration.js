// backend/models/TempRegistration.js

const mongoose = require('mongoose');

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
  expiresAt: {
    type: Date,
    required: true,
    default: () => Date.now() + 10 * 60 * 1000, // 10 minutes
  },
}, {
  timestamps: true,
});

// Index to automatically delete expired documents
tempRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TempRegistration', tempRegistrationSchema);