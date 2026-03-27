// backend/models/CollabThread.js
const mongoose = require('mongoose');

const collabThreadSchema = mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    milestone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    longDescription: {
      type: String,
      maxlength: 5000,
      default: '',
    },
    // Team members listed as plain objects (name + role)
    team: [
      {
        initials: { type: String, maxlength: 4 },
        name:     { type: String, maxlength: 80 },
        role:     { type: String, maxlength: 80 },
      },
    ],
    progress: {
      type: String,
      enum: ['Completed', 'In Progress', 'Needs Review'],
      default: 'In Progress',
    },
    attachment: {
      type: String,
      default: '',
      maxlength: 200,
    },
    branch: {
      type: String,
      default: '',
      maxlength: 100,
    },
    deadline: {
      type: String,
      default: '',
      maxlength: 50,
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

collabThreadSchema.index({ project: 1 });
collabThreadSchema.index({ progress: 1 });
collabThreadSchema.index({ createdAt: -1 });

const CollabThread = mongoose.model('CollabThread', collabThreadSchema);
module.exports = CollabThread;
