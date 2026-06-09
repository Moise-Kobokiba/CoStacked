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
    /**
     * Content type — determines the post's purpose within StackSuite.
     * Maps to the 7 core content types required by the platform spec.
     *  - discussion       : Startup Discussions
     *  - validation       : Idea Validation Posts
     *  - build-in-public  : Build In Public Posts
     *  - showcase         : Project Showcases (also lives in Showcase model)
     *  - founder-matching : Founder Matching
     *  - challenge        : Community Challenges
     *  - accountability   : Accountability Tracking
     */
    contentType: {
      type: String,
      enum: [
        'discussion',
        'validation',
        'build-in-public',
        'showcase',
        'founder-matching',
        'challenge',
        'accountability',
      ],
      default: 'discussion',
    },
    tags: {
      type: [String],
      default: [],
    },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
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
    confidenceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    phase: {
      type: String,
      enum: ['Problem', 'Solution', 'MVP', 'General'],
      default: 'General',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    links: [
      {
        name: { type: String, maxlength: 50 },
        url:  { type: String, maxlength: 500 }
      }
    ],
    // ── Build In Public fields ──
    bipType: {
      type: String,
      enum: ['weekly-update', 'milestone', 'revenue', 'growth', 'launch', null],
      default: null,
    },
    bipMilestone: { type: String, default: '' },
    bipRevenue:   { type: String, default: '' },
    bipUsers:     { type: String, default: '' },
    bipProgress:  { type: Number, default: 0, min: 0, max: 100 },
    bipLookingFor:{ type: String, default: '' },
    followers:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // ── Founder Matching fields ──
    fmRole:           { type: String, default: '' }, // co-founder, developer, designer, marketer, product-manager
    fmSkills:         { type: [String], default: [] },
    fmAvailability:   { type: String, default: '' }, // full-time, part-time, weekends, flexible
    fmLocation:       { type: String, default: '' }, // remote, hybrid, onsite

    // ── Community Challenge fields ──
    challengeType:    { type: String, default: '' }, // build-in-public, saas, ai, landing-page, design, growth
    challengeGoal:    { type: String, default: '' },
    challengeDuration:{ type: String, default: '' }, // days
    challengeRewards:  { type: String, default: '' },
    participants:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    challengeProgress: { type: Map, of: Number, default: {} }, // userId -> progress %

    // ── Accountability Tracking fields ──
    accGoal:         { type: String, default: '' },
    accWeeklyTarget: { type: String, default: '' },
    accStatus:       { type: String, enum: ['in-progress', 'completed', 'missed'], default: 'in-progress' },
    accEncouragements:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // ── Showcase-friendly extras for project showcase posts ──
    projectMeta: {
      stage: { type: String, default: '' },
      techStack: { type: [String], default: [] },
      looking:   { type: [String], default: [] },
      imageUrl:  { type: String, default: '' },
      liveUrl:   { type: String, default: '' },
      githubUrl: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

stackPostSchema.index({ category: 1 });
stackPostSchema.index({ createdAt: -1 });
stackPostSchema.index({ upvotes: -1 });
stackPostSchema.index({ contentType: 1 });
stackPostSchema.index({ boardType: 1, contentType: 1 });

const StackPost = mongoose.model('StackPost', stackPostSchema);
module.exports = StackPost;
