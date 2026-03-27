// backend/models/Showcase.js
const mongoose = require('mongoose');

const showcaseSchema = mongoose.Schema(
  {
    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 300,
    },
    longDescription: {
      type: String,
      maxlength: 5000,
      default: '',
    },
    stage: {
      type: String,
      enum: ['Idea', 'MVP', 'Beta', 'Launched'],
      default: 'Idea',
    },
    techStack: {
      type: [String],
      default: [],
    },
    looking: {
      type: [String],
      default: [],
    },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentCount: {
      type: Number,
      default: 0,
    },
    teamSize: {
      type: Number,
      default: 1,
    },
    launched: {
      type: String,
      default: '',
    },
    // Visual identity stored as a short string key resolved on the frontend
    icon: {
      type: String,
      default: '',
      maxlength: 4,
    },
    gradient: {
      type: String,
      default: 'from-primary/10 to-amber-50',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

showcaseSchema.index({ founder: 1 });
showcaseSchema.index({ stage: 1 });
showcaseSchema.index({ createdAt: -1 });

const Showcase = mongoose.model('Showcase', showcaseSchema);
module.exports = Showcase;
