// backend/models/StackComment.js
const mongoose = require('mongoose');

const stackCommentSchema = mongoose.Schema(
  {
    // Which section does this comment belong to?
    parentType: {
      type: String,
      enum: ['post', 'showcase', 'collabThread'],
      required: true,
    },
    // The _id of the StackPost / Showcase / CollabThread
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    // null = top-level, otherwise reply to another StackComment
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StackComment',
      default: null,
    },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likes:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    editedAt: { type: Date, default: null },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

stackCommentSchema.index({ parentType: 1, parentId: 1, createdAt: -1 });
stackCommentSchema.index({ author: 1 });

const StackComment = mongoose.model('StackComment', stackCommentSchema);
module.exports = StackComment;
