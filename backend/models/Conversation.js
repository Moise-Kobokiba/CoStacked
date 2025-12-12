// backend/models/Conversation.js
const mongoose = require('mongoose');

const conversationSchema = mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    // Optional link to a project (for project-based chats)
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
    },
    // --- NEW FIELD ---
    // True for direct user-to-user connections, false for project interests
    isDirectMessage: {
        type: Boolean,
        default: false,
    }
  },
  { timestamps: true }
);

// Ensure a unique conversation per pair of users for DMs
conversationSchema.index({ participants: 1, isDirectMessage: true }, { unique: true, partialFilterExpression: { isDirectMessage: true } });

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;