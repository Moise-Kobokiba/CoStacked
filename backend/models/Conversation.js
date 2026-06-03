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

// This index helps MongoDB quickly find a conversation given the two participants.
conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;