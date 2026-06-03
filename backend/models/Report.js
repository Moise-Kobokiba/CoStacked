// backend/models/Report.js
const mongoose = require('mongoose');

const reportSchema = mongoose.Schema({
  // Who was reported (optional for support tickets)
  reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  
  // Who made the report
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  reason: { 
    type: String, 
    required: true,
    // --- NEW: Add the new reasons from the support form ---
    enum: [
      'spam', 'harassment', 'copyright', 'inappropriate_content', 'other', // Existing reasons
      'general', 'technical', 'report', 'account' // New reasons from support form
    ]
  },
  comment: { type: String },

  status: {
    type: String,
    enum: ['open', 'resolved', 'dismissed'],
    default: 'open',
  },

  // --- NEW: Two-way communication history ---
  messages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, refPath: 'messages.senderModel' },
      senderModel: { type: String, enum: ['User', 'Admin'], required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;