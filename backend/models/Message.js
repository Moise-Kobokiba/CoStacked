// backend/models/Message.js
const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Conversation',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // --- UPDATED & NEW FIELDS ---
    type: {
      type: String,
      required: true,
      enum: ['text', 'image', 'audio', 'file'],
      default: 'text',
    },
    // The 'text' field is renamed to 'content' to be more generic.
    // It will store the text for text messages, or the URL for media files.
    content: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    // Metadata can store additional information, like the original filename, size, or audio duration.
    metadata: {
      type: Object,
    }
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;