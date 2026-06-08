const mongoose = require('mongoose');

const ideaSchema = mongoose.Schema(
  {
    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // --- Validation Templates Fields ---
    problemStatement: {
      type: String,
      required: true,
    },
    targetAudience: {
      type: String, // Target user
      required: true,
    },
    valueProposition: {
      type: String,
      required: true,
    },
    monetizationModel: {
      type: String, // Revenue models
    },
    risks: {
      type: String,
    },
    assumptions: {
      type: String,
    },
    // --- Visibility ---
    visibility: {
      type: String,
      enum: ['public', 'private'], // 'private' = connections/NDA only
      default: 'public',
    },
    // --- Status ---
    status: {
      type: String,
      enum: ['active', 'validated', 'archived', 'converted'],
      default: 'active',
    },
    // --- Metrics & Validation ---
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    downvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    voteCount: {
        type: Number,
        default: 0
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    shareCount: {
      type: Number,
      default: 0,
    },
    saveCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    // Simple way to track "validation score" - could be weighted later
    validationScore: {
      type: Number,
      default: 0, 
    },
    engagementCount: {
        type: Number,
        default: 0 // Comments + Votes
    },
    // --- Tags ---
    industry: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    stage: {
      type: String, // e.g., 'Concept', 'Problem-Fit'
      default: 'Concept',
    },
    // --- Comments/Feedback embedded or separate model? 
    // For scalability, usually separate, but for MVP we can use a simple array if small, 
    // or rely on a separate Comment model if we want complex threading. 
    // Let's use a separate logic for comments (maybe reuse Review or create new), 
    // but for now, we'll just track the COUNT here.
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
ideaSchema.index({ founder: 1 });
ideaSchema.index({ status: 1 });
ideaSchema.index({ visibility: 1 });

const Idea = mongoose.model('Idea', ideaSchema);

module.exports = Idea;
