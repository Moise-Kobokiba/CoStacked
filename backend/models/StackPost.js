// backend/models/StackPost.js
const mongoose = require('mongoose');

const stackPostSchema = mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    body: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    category: {
      type: String,
      enum: ['Validation', 'Tech', 'Equity', 'Growth', 'Legal', 'General'],
      default: 'General',
    },
    tags: {
      type: [String],
      default: [],
    },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pinned: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

stackPostSchema.index({ category: 1 });
stackPostSchema.index({ createdAt: -1 });
stackPostSchema.index({ upvotes: -1 });

const StackPost = mongoose.model('StackPost', stackPostSchema);
module.exports = StackPost;
