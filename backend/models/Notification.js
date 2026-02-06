// backend/models/Notification.js

const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    recipient: { // The user who will receive the notification
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    sender: { // The user who triggered the notification
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      required: true,
       enum: [
        // Interest-related
        'NEW_INTEREST',
        'INTEREST_APPROVED',
        'INTEREST_REJECTED',
        // New types
        'NEW_MESSAGE',
        'SUBSCRIPTION_SUCCESS',
        'BOOST_SUCCESS',
        'NEW_REVIEW',
        'NEW_CONNECTION_REQUEST',
        'CONNECTION_ACCEPTED',
         // Idea validation
        'IDEA_VOTE',
        'IDEA_COMMENT'
      ],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // References to other documents related to the notification
    interestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Interest'
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation'
    },
    // Generic reference for notifications related to ideas or other models
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'onModel'
    },
    onModel: {
        type: String,
        enum: ['Idea', 'Project', 'Interest', 'User']
    },
    // Optional message content for custom notifications
    message: {
        type: String
    },
    // Legacy field alias for isRead (for backwards compatibility)
    read: {
        type: Boolean,
        default: false
    }
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;