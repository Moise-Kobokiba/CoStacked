// backend/models/SavedItem.js

const mongoose = require('mongoose');

const savedItemSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    itemType: {
      type: String,
      required: true,
      enum: [
        'project',
        'idea',
        'stackpost',
        'showcase',
        'collab',
        'talent',
        'message',
        'article',
        'info',
      ],
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'itemRefModel',
    },
    itemRefModel: {
      type: String,
      required: true,
      enum: ['Project', 'Idea', 'StackPost', 'Showcase', 'CollabThread', 'User', 'Message', 'Article'],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

savedItemSchema.index({ user: 1, itemType: 1, itemId: 1 }, { unique: true });
savedItemSchema.index({ user: 1 });

const SavedItem = mongoose.model('SavedItem', savedItemSchema);

module.exports = SavedItem;