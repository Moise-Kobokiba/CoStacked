// backend/controllers/stackSuiteController.js

const StackPost    = require('../models/StackPost');
const Showcase     = require('../models/Showcase');
const CollabThread = require('../models/CollabThread');
const StackComment = require('../models/StackComment');
const User         = require('../models/User');
const Notification = require('../models/Notification');

/* ═══════════════════════════════════════════════
   HELPER — format time ago
═══════════════════════════════════════════════ */
function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  const w = Math.floor(d / 7);
  return `${w}w ago`;
}

const toArr = v => (typeof v === 'string' ? v.split(',').map(x => x.trim()).filter(Boolean) : Array.isArray(v) ? v : []);

/* ═══════════════════════════════════════════════
   STACK POSTS (covers 7 content types)
═══════════════════════════════════════════════ */

// GET /api/stack-suite/posts
const getPosts = async (req, res) => {
  try {
    const { category, sort, search, phase, contentType } = req.query;
    const query = { isDeleted: false };

    if (category && category !== 'all') query.category = category;
    if (phase && phase !== 'all') query.phase = phase;
    if (contentType && contentType !== 'all') query.contentType = contentType;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body:  { $regex: search, $options: 'i' } },
        { tags:  { $regex: search, $options: 'i' } },
      ];
    }

    let sortOpt = { createdAt: -1 };
    if (sort === 'popular') sortOpt = { 'upvotes': -1, createdAt: -1 };

    const posts = await StackPost.find(query)
      .populate('author', 'name avatarUrl role headline')
      .sort(sortOpt)
      .lean();

    const shaped = posts.map(p => ({
      ...p,
      upvoteCount: p.upvotes.length,
      followerCount: p.followers ? p.followers.length : 0,
      time: timeAgo(p.createdAt),
      isUpvoted: req.user ? p.upvotes.some(id => id.toString() === req.user._id.toString()) : false,
      isFollowing: req.user && p.followers ? p.followers.some(id => id.toString() === req.user._id.toString()) : false,
    }));

    res.json(shaped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/stack-suite/posts/:id
const getPostById = async (req, res) => {
  try {
    const post = await StackPost.findById(req.params.id)
      .populate('author', 'name avatarUrl role headline')
      .lean();
    if (!post || post.isDeleted) return res.status(404).json({ message: 'Post not found' });

    // Increment view count
    await StackPost.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    res.json({
      ...post,
        upvoteCount: post.upvotes.length,
        downvoteCount: post.downvotes.length,
        viewCount: post.viewCount + 1,
        followerCount: post.followers ? post.followers.length : 0,
        time: timeAgo(post.createdAt),
        isUpvoted: req.user ? post.upvotes.some(id => id.toString() === req.user._id.toString()) : false,
        isDownvoted: req.user ? post.downvotes.some(id => id.toString() === req.user._id.toString()) : false,
        isFollowing: req.user ? (post.followers ? post.followers.some(id => id.toString() === req.user._id.toString()) : false) : false,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/stack-suite/posts  (auth required) — supports all 7 content types
const createPost = async (req, res) => {
  try {
    const {
      title, body, category, contentType, tags, phase, confidenceScore, links,
      // Build In Public fields
      bipType, bipMilestone, bipRevenue, bipUsers, bipProgress, bipLookingFor,
      // Founder Matching fields
      fmRole, fmSkills, fmAvailability, fmLocation,
      // Community Challenge fields
      challengeType, challengeGoal, challengeDuration, challengeRewards,
      // Accountability Tracking fields
      accGoal, accWeeklyTarget, accStatus,
      // Showcase fields (for StackPost-based showcase posts)
      projectMeta
    } = req.body;
    if (!title || !body) return res.status(400).json({ message: 'Title and body are required' });

    const tagList = toArr(tags);

    const postData = {
      author: req.user._id,
      title,
      body,
      category: category || 'General',
      contentType: contentType || 'discussion',
      tags: tagList,
      phase: phase || 'General',
      confidenceScore: confidenceScore || 0,
      links: links || [],
    };

    // Attach type-specific fields
    if (contentType === 'build-in-public') {
      postData.bipType = bipType || 'weekly-update';
      postData.bipMilestone = bipMilestone || '';
      postData.bipRevenue = bipRevenue || '';
      postData.bipUsers = bipUsers || '';
      postData.bipProgress = bipProgress || 0;
      postData.bipLookingFor = bipLookingFor || '';
    } else if (contentType === 'founder-matching') {
      postData.fmRole = fmRole || '';
      postData.fmSkills = toArr(fmSkills);
      postData.fmAvailability = fmAvailability || 'part-time';
      postData.fmLocation = fmLocation || 'remote';
    } else if (contentType === 'challenge') {
      postData.challengeType = challengeType || 'build-in-public';
      postData.challengeGoal = challengeGoal || '';
      postData.challengeDuration = challengeDuration || '30';
      postData.challengeRewards = challengeRewards || '';
    } else if (contentType === 'accountability') {
      postData.accGoal = accGoal || '';
      postData.accWeeklyTarget = accWeeklyTarget || '';
      postData.accStatus = accStatus || 'in-progress';
    } else if (contentType === 'showcase' && projectMeta) {
      postData.projectMeta = {
        stage: projectMeta.stage || 'Idea',
        techStack: toArr(projectMeta.techStack),
        looking:   toArr(projectMeta.looking),
        imageUrl:  projectMeta.imageUrl || '',
        liveUrl:   projectMeta.liveUrl || '',
        githubUrl: projectMeta.githubUrl || '',
      };
    }

    const post = await StackPost.create(postData);

    await post.populate('author', 'name avatarUrl role headline');
    const p = post.toObject();
    res.status(201).json({ ...p, upvoteCount: 0, time: 'just now', isUpvoted: false });

    // Emit real-time created event to stacksuite feed and post room
    try {
      const socketUtil = require('../utils/socket');
      const io = socketUtil.getIo();
      if (io) {
        io.to('stacksuite_feed').emit('stacksuite_post_created', { post: { ...p, upvoteCount: 0, time: 'just now', isUpvoted: false } });
        io.to(`stacksuite:${post._id}`).emit('stacksuite_post_created', { post: { ...p, upvoteCount: 0, time: 'just now', isUpvoted: false } });
      }
    } catch (e) { console.error('Socket emit error (stacksuite create):', e); }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/stack-suite/posts/:id/upvote  (auth required)
const upvotePost = async (req, res) => {
  try {
    const post = await StackPost.findById(req.params.id);
    if (!post || post.isDeleted) return res.status(404).json({ message: 'Post not found' });

    const uid = req.user._id.toString();
    const idx = post.upvotes.findIndex(id => id.toString() === uid);
    const downIdx = post.downvotes.findIndex(id => id.toString() === uid);
    if (downIdx > -1) post.downvotes.splice(downIdx, 1);
    
    if (idx > -1) {
      post.upvotes.splice(idx, 1);
    } else {
      post.upvotes.push(req.user._id);
    }
    await post.save();
    res.json({ upvoteCount: post.upvotes.length, downvoteCount: post.downvotes.length, isUpvoted: idx === -1, isDownvoted: false });
    try {
      const socketUtil = require('../utils/socket');
      const io = socketUtil.getIo();
      if (io) io.to(`stacksuite:${post._id}`).emit('stacksuite_vote_update', { postId: post._id, upvoteCount: post.upvotes.length, downvoteCount: post.downvotes.length });
    } catch (e) { console.error('Socket emit error (stacksuite upvote):', e); }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stack-suite/posts/:id/follow
const followPost = async (req, res) => {
  try {
    const post = await StackPost.findById(req.params.id);
    if (!post || post.isDeleted) return res.status(404).json({ message: 'Post not found' });
    const uid = req.user._id.toString();
    if (!post.followers) post.followers = [];
    if (!post.followers.some(id => id.toString() === uid)) {
      post.followers.push(req.user._id);
      await post.save();

      // Notify author
      if (post.author.toString() !== uid) {
        const Notification = require('../models/Notification');
        const notif = await Notification.create({ recipient: post.author, sender: req.user._id, type: 'FOLLOW_POST', relatedId: post._id, onModel: 'StackPost' });
        try { const socketUtil = require('../utils/socket'); const io = socketUtil.getIo(); if (io) io.to(post.author.toString()).emit('notification_created', notif); } catch (e) {}
      }

      try { const socketUtil = require('../utils/socket'); const io = socketUtil.getIo(); if (io) io.to(`stacksuite:${post._id}`).emit('stacksuite_follow_update', { postId: post._id, followerCount: post.followers.length }); } catch (e) { console.error('Socket emit error (follow):', e); }
    }
    res.json({ followerCount: post.followers.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/stack-suite/posts/:id/unfollow
const unfollowPost = async (req, res) => {
  try {
    const post = await StackPost.findById(req.params.id);
    if (!post || post.isDeleted) return res.status(404).json({ message: 'Post not found' });
    const uid = req.user._id.toString();
    if (post.followers && post.followers.some(id => id.toString() === uid)) {
      post.followers = post.followers.filter(id => id.toString() !== uid);
      await post.save();
      try { const socketUtil = require('../utils/socket'); const io = socketUtil.getIo(); if (io) io.to(`stacksuite:${post._id}`).emit('stacksuite_follow_update', { postId: post._id, followerCount: post.followers.length }); } catch (e) { console.error('Socket emit error (unfollow):', e); }
    }
    res.json({ followerCount: post.followers ? post.followers.length : 0 });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/stack-suite/posts/:id/downvote
const downvotePost = async (req, res) => {
  try {
    const post = await StackPost.findById(req.params.id);
    if (!post || post.isDeleted) return res.status(404).json({ message: 'Post not found' });

    const uid = req.user._id.toString();
    const idx = post.downvotes.findIndex(id => id.toString() === uid);
    const upIdx = post.upvotes.findIndex(id => id.toString() === uid);
    if (upIdx > -1) post.upvotes.splice(upIdx, 1);
    
    if (idx > -1) {
      post.downvotes.splice(idx, 1);
    } else {
      post.downvotes.push(req.user._id);
    }
    await post.save();
    res.json({ upvoteCount: post.upvotes.length, downvoteCount: post.downvotes.length, isDownvoted: idx === -1, isUpvoted: false });
    try {
      const socketUtil = require('../utils/socket');
      const io = socketUtil.getIo();
      if (io) io.to(`stacksuite:${post._id}`).emit('stacksuite_vote_update', { postId: post._id, upvoteCount: post.upvotes.length, downvoteCount: post.downvotes.length });
    } catch (e) { console.error('Socket emit error (stacksuite downvote):', e); }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stack-suite/posts/:id/follow — follow a Build In Public post
const toggleFollowPost = async (req, res) => {
  try {
    const post = await StackPost.findById(req.params.id);
    if (!post || post.isDeleted) return res.status(404).json({ message: 'Post not found' });

    if (!post.followers) post.followers = [];
    const uid = req.user._id.toString();
    const idx = post.followers.findIndex(id => id.toString() === uid);
    if (idx > -1) {
      post.followers.splice(idx, 1);
    } else {
      post.followers.push(req.user._id);
    }
    await post.save();
    res.json({ followerCount: post.followers.length, isFollowing: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stack-suite/posts/:id/join — join a community challenge
const toggleJoinChallenge = async (req, res) => {
  try {
    const post = await StackPost.findById(req.params.id);
    if (!post || post.isDeleted) return res.status(404).json({ message: 'Post not found' });
    if (post.contentType !== 'challenge')
      return res.status(400).json({ message: 'Post is not a challenge' });

    if (!post.participants) post.participants = [];
    const uid = req.user._id.toString();
    const idx = post.participants.findIndex(id => id.toString() === uid);
    if (idx > -1) {
      post.participants.splice(idx, 1);
      if (post.challengeProgress) post.challengeProgress.delete(req.user._id.toString());
    } else {
      post.participants.push(req.user._id);
      if (!post.challengeProgress) post.challengeProgress = new Map();
      post.challengeProgress.set(req.user._id.toString(), 0);
    }
    await post.save();
    res.json({ participantCount: post.participants.length, isParticipating: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stack-suite/posts/:id/progress — update own challenge progress
const updateChallengeProgress = async (req, res) => {
  try {
    const post = await StackPost.findById(req.params.id);
    if (!post || post.isDeleted) return res.status(404).json({ message: 'Post not found' });
    if (post.contentType !== 'challenge')
      return res.status(400).json({ message: 'Post is not a challenge' });

    const uid = req.user._id.toString();
    const isParticipant = post.participants && post.participants.some(id => id.toString() === uid);
    if (!isParticipant) return res.status(403).json({ message: 'Must be a participant' });

    const { progress } = req.body;
    const clamped = Math.max(0, Math.min(100, Number(progress) || 0));
    if (!post.challengeProgress) post.challengeProgress = new Map();
    post.challengeProgress.set(uid, clamped);
    await post.save();
    res.json({ progress: clamped });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stack-suite/posts/:id/encourage — encourage an accountability post
const toggleEncourageAccountability = async (req, res) => {
  try {
    const post = await StackPost.findById(req.params.id);
    if (!post || post.isDeleted) return res.status(404).json({ message: 'Post not found' });
    if (post.contentType !== 'accountability')
      return res.status(400).json({ message: 'Post is not an accountability post' });

    if (!post.accEncouragements) post.accEncouragements = [];
    const uid = req.user._id.toString();
    const idx = post.accEncouragements.findIndex(id => id.toString() === uid);
    if (idx > -1) {
      post.accEncouragements.splice(idx, 1);
    } else {
      post.accEncouragements.push(req.user._id);
    }
    await post.save();
    res.json({ encouragementCount: post.accEncouragements.length, isEncouraged: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stack-suite/posts/:id — edit post (author only)
const updatePost = async (req, res) => {
  try {
    const post = await StackPost.findById(req.params.id);
    if (!post || post.isDeleted) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString())
      return res.status(401).json({ message: 'Not authorized' });

    const { title, body, category, tags, links, accStatus, accGoal, accWeeklyTarget, bipProgress } = req.body;
    if (title) post.title = title;
    if (body) post.body = body;
    if (category) post.category = category;
    if (tags !== undefined) post.tags = toArr(tags);
    if (links !== undefined) post.links = links;
    if (accStatus && post.contentType === 'accountability') post.accStatus = accStatus;
    if (accGoal && post.contentType === 'accountability') post.accGoal = accGoal;
    if (accWeeklyTarget && post.contentType === 'accountability') post.accWeeklyTarget = accWeeklyTarget;
    if (typeof bipProgress === 'number' && post.contentType === 'build-in-public') {
      post.bipProgress = Math.max(0, Math.min(100, bipProgress));
    }

    await post.save();
    await post.populate('author', 'name avatarUrl role headline');
    res.json({ ...post.toObject(), upvoteCount: post.upvotes.length, time: timeAgo(post.createdAt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/stack-suite/posts/:id  (author only)
const deletePost = async (req, res) => {
  try {
    const post = await StackPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString())
      return res.status(401).json({ message: 'Not authorized' });
    post.isDeleted = true;
    await post.save();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════
   SHOWCASES
═══════════════════════════════════════════════ */

// GET /api/stack-suite/showcases
const getShowcases = async (req, res) => {
  try {
    const { stage, search } = req.query;
    let query = { isDeleted: false };
    if (stage && stage !== 'all') query.stage = stage;
    if (search) query.$or = [
      { name:        { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];

    let sortOpt = { createdAt: -1 };
    if (req.query.sort === 'popular') sortOpt = { upvotes: -1, createdAt: -1 };

    const showcases = await Showcase.find(query)
      .populate('founder', 'name avatarUrl role')
      .sort(sortOpt)
      .lean();

    const shaped = showcases.map(s => ({
      ...s,
      upvoteCount: s.upvotes.length,
      downvoteCount: s.downvotes.length,
      followerCount: s.followers ? s.followers.length : 0,
      time: timeAgo(s.createdAt),
      isUpvoted: req.user ? s.upvotes.some(id => id.toString() === req.user._id.toString()) : false,
      isDownvoted: req.user ? s.downvotes.some(id => id.toString() === req.user._id.toString()) : false,
      isFollowing: req.user ? (s.followers ? s.followers.some(id => id.toString() === req.user._id.toString()) : false) : false,
    }));


    res.json(shaped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/stack-suite/showcases/:id
const getShowcaseById = async (req, res) => {
  try {
    const s = await Showcase.findById(req.params.id)
      .populate('founder', 'name avatarUrl role headline')
      .lean();
    if (!s || s.isDeleted) return res.status(404).json({ message: 'Showcase not found' });

    await Showcase.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({
      ...s,
      upvoteCount: s.upvotes.length,
      downvoteCount: s.downvotes.length,
      views: s.views + 1,
      time: timeAgo(s.createdAt),
      isUpvoted: req.user ? s.upvotes.some(id => id.toString() === req.user._id.toString()) : false,
      isDownvoted: req.user ? s.downvotes.some(id => id.toString() === req.user._id.toString()) : false,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/stack-suite/showcases  (auth)
const createShowcase = async (req, res) => {
  try {
    const { name, description, longDescription, stage, techStack, looking, teamSize, launched, icon, gradient, links, imageUrl, liveUrl, githubUrl } = req.body;
    if (!name || !description) return res.status(400).json({ message: 'Name and description are required' });

    const showcase = await Showcase.create({
      founder: req.user._id,
      name, description,
      longDescription: longDescription || '',
      stage: stage || 'Idea',
      techStack: toArr(techStack),
      looking:   toArr(looking),
      teamSize:  teamSize || 1,
      launched:  launched || '',
      icon:      icon || name.slice(0, 2).toUpperCase(),
      gradient:  gradient || 'from-primary/10 to-amber-50',
      links:     links || [],
      imageUrl:  imageUrl || '',
      liveUrl:   liveUrl || '',
      githubUrl: githubUrl || ''
    });

    await showcase.populate('founder', 'name avatarUrl role headline');
    const s = showcase.toObject();
    res.status(201).json({ ...s, upvoteCount: 0, time: 'just now', isUpvoted: false });
    try {
      const socketUtil = require('../utils/socket');
      const io = socketUtil.getIo();
      if (io) {
        io.to('stacksuite_feed').emit('stacksuite_showcase_created', { showcase: { ...s, upvoteCount: 0, time: 'just now', isUpvoted: false } });
        io.to(`stacksuite:showcase:${showcase._id}`).emit('stacksuite_showcase_created', { showcase: { ...s, upvoteCount: 0, time: 'just now', isUpvoted: false } });
      }
    } catch (e) { console.error('Socket emit error (showcase create):', e); }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/stack-suite/showcases/:id/upvote  (auth)
const upvoteShowcase = async (req, res) => {
  try {
    const showcase = await Showcase.findById(req.params.id);
    if (!showcase || showcase.isDeleted) return res.status(404).json({ message: 'Showcase not found' });

    const uid = req.user._id.toString();
    const idx = showcase.upvotes.findIndex(id => id.toString() === uid);
    const downIdx = showcase.downvotes.findIndex(id => id.toString() === uid);
    if (downIdx > -1) showcase.downvotes.splice(downIdx, 1);

    if (idx > -1) { showcase.upvotes.splice(idx, 1); } else { showcase.upvotes.push(req.user._id); }
    await showcase.save();
    res.json({ upvoteCount: showcase.upvotes.length, downvoteCount: showcase.downvotes.length, isUpvoted: idx === -1, isDownvoted: false });
    try {
      const socketUtil = require('../utils/socket');
      const io = socketUtil.getIo();
      if (io) io.to(`stacksuite:showcase:${showcase._id}`).emit('stacksuite_showcase_vote_update', { showcaseId: showcase._id, upvoteCount: showcase.upvotes.length, downvoteCount: showcase.downvotes.length });
    } catch (e) { console.error('Socket emit error (showcase upvote):', e); }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stack-suite/showcases/:id/downvote
const downvoteShowcase = async (req, res) => {
  try {
    const showcase = await Showcase.findById(req.params.id);
    if (!showcase || showcase.isDeleted) return res.status(404).json({ message: 'Showcase not found' });

    const uid = req.user._id.toString();
    const idx = showcase.downvotes.findIndex(id => id.toString() === uid);
    const upIdx = showcase.upvotes.findIndex(id => id.toString() === uid);
    if (upIdx > -1) showcase.upvotes.splice(upIdx, 1);

    if (idx > -1) { showcase.downvotes.splice(idx, 1); } else { showcase.downvotes.push(req.user._id); }
    await showcase.save();
    res.json({ upvoteCount: showcase.upvotes.length, downvoteCount: showcase.downvotes.length, isDownvoted: idx === -1, isUpvoted: false });
    try {
      const socketUtil = require('../utils/socket');
      const io = socketUtil.getIo();
      if (io) io.to(`stacksuite:showcase:${showcase._id}`).emit('stacksuite_showcase_vote_update', { showcaseId: showcase._id, upvoteCount: showcase.upvotes.length, downvoteCount: showcase.downvotes.length });
    } catch (e) { console.error('Socket emit error (showcase downvote):', e); }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stack-suite/showcases/:id/follow
const followShowcase = async (req, res) => {
  try {
    const showcase = await Showcase.findById(req.params.id);
    if (!showcase || showcase.isDeleted) return res.status(404).json({ message: 'Showcase not found' });
    const uid = req.user._id.toString();
    if (!showcase.followers) showcase.followers = [];
    if (!showcase.followers.some(id => id.toString() === uid)) {
      showcase.followers.push(req.user._id);
      await showcase.save();

      // Notify founder/author
      const recipient = showcase.founder ? showcase.founder : null;
      if (recipient && recipient.toString() !== uid) {
        const Notification = require('../models/Notification');
        const notif = await Notification.create({ recipient, sender: req.user._id, type: 'FOLLOW_SHOWCASE', relatedId: showcase._id, onModel: 'Showcase' });
        try { const socketUtil = require('../utils/socket'); const io = socketUtil.getIo(); if (io) io.to(recipient.toString()).emit('notification_created', notif); } catch (e) {}
      }

      try { const socketUtil = require('../utils/socket'); const io = socketUtil.getIo(); if (io) io.to(`stacksuite:showcase:${showcase._id}`).emit('stacksuite_showcase_follow_update', { showcaseId: showcase._id, followerCount: showcase.followers.length }); } catch (e) { console.error('Socket emit error (showcase follow):', e); }
    }
    res.json({ followerCount: showcase.followers.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/stack-suite/showcases/:id/unfollow
const unfollowShowcase = async (req, res) => {
  try {
    const showcase = await Showcase.findById(req.params.id);
    if (!showcase || showcase.isDeleted) return res.status(404).json({ message: 'Showcase not found' });
    const uid = req.user._id.toString();
    if (showcase.followers && showcase.followers.some(id => id.toString() === uid)) {
      showcase.followers = showcase.followers.filter(id => id.toString() !== uid);
      await showcase.save();
      try { const socketUtil = require('../utils/socket'); const io = socketUtil.getIo(); if (io) io.to(`stacksuite:showcase:${showcase._id}`).emit('stacksuite_showcase_follow_update', { showcaseId: showcase._id, followerCount: showcase.followers.length }); } catch (e) { console.error('Socket emit error (showcase unfollow):', e); }
    }
    res.json({ followerCount: showcase.followers ? showcase.followers.length : 0 });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/stack-suite/showcases/:id  (auth)
const updateShowcase = async (req, res) => {
  try {
    const showcase = await Showcase.findById(req.params.id);
    if (!showcase || showcase.isDeleted) return res.status(404).json({ message: 'Showcase not found' });
    if (showcase.founder.toString() !== req.user._id.toString())
      return res.status(401).json({ message: 'Not authorized' });

    const { name, description, longDescription, stage, techStack, looking, teamSize, launched, icon, gradient, links } = req.body;

    if (name) showcase.name = name;
    if (description) showcase.description = description;
    if (longDescription !== undefined) showcase.longDescription = longDescription;
    if (stage) showcase.stage = stage;
    if (techStack !== undefined) showcase.techStack = toArr(techStack);
    if (looking !== undefined) showcase.looking = toArr(looking);
    if (teamSize !== undefined) showcase.teamSize = teamSize;
    if (launched !== undefined) showcase.launched = launched;
    if (icon !== undefined) showcase.icon = icon;
    if (gradient) showcase.gradient = gradient;
    if (links !== undefined) showcase.links = links;

    await showcase.save();
    await showcase.populate('founder', 'name avatarUrl role headline');

    res.json({ ...showcase.toObject(), upvoteCount: showcase.upvotes.length, time: timeAgo(showcase.createdAt), isUpvoted: showcase.upvotes.some(id => id.toString() === req.user._id.toString()) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/stack-suite/showcases/:id  (auth - author only)
const deleteShowcase = async (req, res) => {
  try {
    const showcase = await Showcase.findById(req.params.id);
    if (!showcase) return res.status(404).json({ message: 'Showcase not found' });
    if (showcase.founder.toString() !== req.user._id.toString())
      return res.status(401).json({ message: 'Not authorized' });

    showcase.isDeleted = true;
    await showcase.save();
    res.json({ message: 'Showcase deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════
   COLLAB THREADS
═══════════════════════════════════════════════ */

// GET /api/stack-suite/collab
const getCollabThreads = async (req, res) => {
  try {
    const { progress, search } = req.query;
    let query = { isDeleted: false };
    if (progress && progress !== 'all') query.progress = progress;
    if (search) query.$or = [
      { milestone:   { $regex: search, $options: 'i' } },
      { project:     { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];

    let sortOpt = { createdAt: -1 };
    if (req.query.sort === 'popular') sortOpt = { upvotes: -1, createdAt: -1 };

    const threads = await CollabThread.find(query)
      .populate('author', 'name avatarUrl role')
      .sort(sortOpt)
      .lean();

    res.json(threads.map(t => ({
      ...t,
      upvoteCount: t.upvotes.length,
      downvoteCount: t.downvotes.length,
      followerCount: t.followers ? t.followers.length : 0,
      time: timeAgo(t.createdAt),
      isFollowing: req.user ? (t.followers ? t.followers.some(id => id.toString() === req.user._id.toString()) : false) : false
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/stack-suite/collab/:id
const getCollabThreadById = async (req, res) => {
  try {
    const t = await CollabThread.findById(req.params.id)
      .populate('author', 'name avatarUrl role headline')
      .lean();
    if (!t || t.isDeleted) return res.status(404).json({ message: 'Thread not found' });

    await CollabThread.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({
      ...t,
      upvoteCount: t.upvotes.length,
      downvoteCount: t.downvotes.length,
      views: t.views + 1,
      followerCount: t.followers ? t.followers.length : 0,
      time: timeAgo(t.createdAt),
      isFollowing: req.user ? (t.followers ? t.followers.some(id => id.toString() === req.user._id.toString()) : false) : false
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stack-suite/collab/:id/follow
const followCollab = async (req, res) => {
  try {
    const thread = await CollabThread.findById(req.params.id);
    if (!thread || thread.isDeleted) return res.status(404).json({ message: 'Thread not found' });
    const uid = req.user._id.toString();
    if (!thread.followers) thread.followers = [];
    if (!thread.followers.some(id => id.toString() === uid)) {
      thread.followers.push(req.user._id);
      await thread.save();
      // Notify author
      if (thread.author && thread.author.toString() !== uid) {
        const Notification = require('../models/Notification');
        const notif = await Notification.create({ recipient: thread.author, sender: req.user._id, type: 'FOLLOW_COLLAB', relatedId: thread._id, onModel: 'CollabThread' });
        try { const socketUtil = require('../utils/socket'); const io = socketUtil.getIo(); if (io) io.to(thread.author.toString()).emit('notification_created', notif); } catch (e) {}
      }
      try { const socketUtil = require('../utils/socket'); const io = socketUtil.getIo(); if (io) io.to(`stacksuite:collab:${thread._id}`).emit('stacksuite_collab_follow_update', { threadId: thread._id, followerCount: thread.followers.length }); } catch (e) { console.error('Socket emit error (collab follow):', e); }
    }
    res.json({ followerCount: thread.followers.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/stack-suite/collab/:id/unfollow
const unfollowCollab = async (req, res) => {
  try {
    const thread = await CollabThread.findById(req.params.id);
    if (!thread || thread.isDeleted) return res.status(404).json({ message: 'Thread not found' });
    const uid = req.user._id.toString();
    if (thread.followers && thread.followers.some(id => id.toString() === uid)) {
      thread.followers = thread.followers.filter(id => id.toString() !== uid);
      await thread.save();
      try { const socketUtil = require('../utils/socket'); const io = socketUtil.getIo(); if (io) io.to(`stacksuite:collab:${thread._id}`).emit('stacksuite_collab_follow_update', { threadId: thread._id, followerCount: thread.followers.length }); } catch (e) { console.error('Socket emit error (collab unfollow):', e); }
    }
    res.json({ followerCount: thread.followers ? thread.followers.length : 0 });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/stack-suite/collab  (auth)
const createCollabThread = async (req, res) => {
  try {
    const { project, milestone, description, longDescription, team, progress, attachment, branch, deadline, links } = req.body;
    if (!project || !milestone || !description)
      return res.status(400).json({ message: 'Project, milestone, and description are required' });

    const thread = await CollabThread.create({
      author: req.user._id,
      project, milestone, description,
      longDescription: longDescription || '',
      team: Array.isArray(team) ? team : [],
      progress: progress || 'In Progress',
      attachment: attachment || '',
      branch: branch || '',
      deadline: deadline || '',
      links: links || []
    });

    await thread.populate('author', 'name avatarUrl role headline');
    const t = thread.toObject();
    res.status(201).json({ ...t, time: 'just now' });
    try {
      const socketUtil = require('../utils/socket');
      const io = socketUtil.getIo();
      if (io) {
        io.to('stacksuite_feed').emit('stacksuite_collab_created', { thread: { ...t, time: 'just now' } });
        io.to(`stacksuite:collab:${thread._id}`).emit('stacksuite_collab_created', { thread: { ...t, time: 'just now' } });
      }
    } catch (e) { console.error('Socket emit error (collab create):', e); }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/stack-suite/collab/:id  (auth)
const updateCollabThread = async (req, res) => {
  try {
    const thread = await CollabThread.findById(req.params.id);
    if (!thread || thread.isDeleted) return res.status(404).json({ message: 'Thread not found' });
    if (thread.author.toString() !== req.user._id.toString())
      return res.status(401).json({ message: 'Not authorized' });

    const { project, milestone, description, longDescription, team, progress, attachment, branch, deadline, links } = req.body;

    if (project) thread.project = project;
    if (milestone) thread.milestone = milestone;
    if (description) thread.description = description;
    if (longDescription !== undefined) thread.longDescription = longDescription;
    if (team !== undefined) thread.team = Array.isArray(team) ? team : [];
    if (progress) thread.progress = progress;
    if (attachment !== undefined) thread.attachment = attachment;
    if (branch !== undefined) thread.branch = branch;
    if (deadline !== undefined) thread.deadline = deadline;
    if (links !== undefined) thread.links = links;

    await thread.save();
    await thread.populate('author', 'name avatarUrl role headline');
    res.json({ ...thread.toObject(), time: timeAgo(thread.createdAt) });
    try {
      const socketUtil = require('../utils/socket');
      const io = socketUtil.getIo();
      if (io) io.to(`stacksuite:collab:${thread._id}`).emit('stacksuite_collab_updated', { threadId: thread._id });
    } catch (e) { console.error('Socket emit error (collab update):', e); }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/stack-suite/collab/:id  (auth - author only)
const deleteCollabThread = async (req, res) => {
  try {
    const thread = await CollabThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    if (thread.author.toString() !== req.user._id.toString())
      return res.status(401).json({ message: 'Not authorized' });

    thread.isDeleted = true;
    await thread.save();
    res.json({ message: 'Thread deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stack-suite/collab/:id/upvote
const upvoteCollab = async (req, res) => {
  try {
    const thread = await CollabThread.findById(req.params.id);
    if (!thread || thread.isDeleted) return res.status(404).json({ message: 'Thread not found' });

    const uid = req.user._id.toString();
    const idx = thread.upvotes.findIndex(id => id.toString() === uid);
    const downIdx = thread.downvotes.findIndex(id => id.toString() === uid);
    if (downIdx > -1) thread.downvotes.splice(downIdx, 1);

    if (idx > -1) { thread.upvotes.splice(idx, 1); } else { thread.upvotes.push(req.user._id); }
    await thread.save();
    res.json({ upvoteCount: thread.upvotes.length, downvoteCount: thread.downvotes.length, isUpvoted: idx === -1, isDownvoted: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stack-suite/collab/:id/downvote
const downvoteCollab = async (req, res) => {
  try {
    const thread = await CollabThread.findById(req.params.id);
    if (!thread || thread.isDeleted) return res.status(404).json({ message: 'Thread not found' });

    const uid = req.user._id.toString();
    const idx = thread.downvotes.findIndex(id => id.toString() === uid);
    const upIdx = thread.upvotes.findIndex(id => id.toString() === uid);
    if (upIdx > -1) thread.upvotes.splice(upIdx, 1);

    if (idx > -1) { thread.downvotes.splice(idx, 1); } else { thread.downvotes.push(req.user._id); }
    await thread.save();
    res.json({ upvoteCount: thread.upvotes.length, downvoteCount: thread.downvotes.length, isDownvoted: idx === -1, isUpvoted: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/* ═══════════════════════════════════════════════
   STACK COMMENTS (shared across all content types)
═══════════════════════════════════════════════ */

// GET /api/stack-suite/comments/:parentType/:parentId
const getComments = async (req, res) => {
  try {
    const { parentType, parentId } = req.params;

    const topLevel = await StackComment.find({
      parentType, parentId,
      parentComment: null,
      isDeleted: false,
    })
      .populate('author', 'name avatarUrl role headline')
      .sort({ createdAt: -1 })
      .lean();

    const replies = await StackComment.find({
      parentType, parentId,
      parentComment: { $ne: null },
      isDeleted: false,
    })
      .populate('author', 'name avatarUrl role headline')
      .sort({ createdAt: 1 })
      .lean();

    const shape = (c) => ({
      ...c,
      upvoteCount: c.upvotes.length,
      likeCount:   c.likes.length,
      time: timeAgo(c.createdAt),
      isUpvoted: req.user ? c.upvotes.some(id => id.toString() === req.user?._id.toString()) : false,
      isLiked:   req.user ? c.likes.some(id   => id.toString() === req.user?._id.toString()) : false,
    });

    const withReplies = topLevel.map(c => ({
      ...shape(c),
      replies: replies
        .filter(r => r.parentComment.toString() === c._id.toString())
        .map(shape),
    }));

    res.json(withReplies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/stack-suite/comments/:parentType/:parentId  (auth)
const addComment = async (req, res) => {
  try {
    const { parentType, parentId } = req.params;
    const { content, parentCommentId } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ message: 'Content is required' });

    if (parentCommentId) {
      const parent = await StackComment.findById(parentCommentId);
      if (!parent || parent.parentId.toString() !== parentId)
        return res.status(404).json({ message: 'Parent comment not found' });
    }

    const comment = await StackComment.create({
      parentType,
      parentId,
      author: req.user._id,
      content: content.trim(),
      parentComment: parentCommentId || null,
    });

    await comment.populate('author', 'name avatarUrl role headline');

    // Bump comment count on parent document
    const Model = parentType === 'post' ? StackPost
      : parentType === 'showcase' ? Showcase
      : CollabThread;
    await Model.findByIdAndUpdate(parentId, { $inc: { commentCount: 1 } });

    const c = comment.toObject();
    res.status(201).json({ ...c, upvoteCount: 0, likeCount: 0, time: 'just now', isUpvoted: false, isLiked: false, replies: [] });
    try {
      const socketUtil = require('../utils/socket');
      const io = socketUtil.getIo();
      if (io) {
        // Emit to post/showcase/collab room
        io.to(`stacksuite:${parentId}`).emit('stacksuite_comment_added', { parentType, parentId, comment: { ...c, time: 'just now' } });
        // Notify the author of parent if not the commenter
        const Model = parentType === 'post' ? StackPost : parentType === 'showcase' ? Showcase : CollabThread;
        const parent = await Model.findById(parentId);
        if (parent && parent.author && parent.author.toString() !== req.user._id.toString()) {
          const notif = await require('../models/Notification').create({ recipient: parent.author, sender: req.user._id, type: 'STACK_COMMENT', relatedId: parentId, onModel: parentType === 'post' ? 'StackPost' : parentType === 'showcase' ? 'Showcase' : 'CollabThread' });
          try { if (io) io.to(parent.author.toString()).emit('notification_created', notif); } catch (e) {}
        }
      }
    } catch (e) { console.error('Socket emit error (stacksuite comment):', e); }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/stack-suite/comments/:id  (auth - author only) - edit comment content
const editComment = async (req, res) => {
  try {
    const comment = await StackComment.findById(req.params.id);
    if (!comment || comment.isDeleted) return res.status(404).json({ message: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString())
      return res.status(401).json({ message: 'Not authorized' });

    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ message: 'Content is required' });

    comment.content = content.trim();
    comment.editedAt = new Date();
    await comment.save();
    await comment.populate('author', 'name avatarUrl role headline');
    const c = comment.toObject();
    res.json({ ...c, upvoteCount: c.upvotes.length, likeCount: c.likes.length, time: timeAgo(c.createdAt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stack-suite/comments/:id/upvote  (auth)
const upvoteComment = async (req, res) => {
  try {
    const comment = await StackComment.findById(req.params.id);
    if (!comment || comment.isDeleted) return res.status(404).json({ message: 'Comment not found' });
    const uid = req.user._id.toString();
    const idx = comment.upvotes.findIndex(id => id.toString() === uid);
    if (idx > -1) { comment.upvotes.splice(idx, 1); } else { comment.upvotes.push(req.user._id); }
    await comment.save();
    res.json({ upvoteCount: comment.upvotes.length, isUpvoted: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stack-suite/comments/:id/like  (auth)
const likeComment = async (req, res) => {
  try {
    const comment = await StackComment.findById(req.params.id);
    if (!comment || comment.isDeleted) return res.status(404).json({ message: 'Comment not found' });
    const uid = req.user._id.toString();
    const idx = comment.likes.findIndex(id => id.toString() === uid);
    if (idx > -1) { comment.likes.splice(idx, 1); } else { comment.likes.push(req.user._id); }
    await comment.save();
    res.json({ likeCount: comment.likes.length, isLiked: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/stack-suite/comments/:id  (auth - author only)
const deleteComment = async (req, res) => {
  try {
    const comment = await StackComment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString())
      return res.status(401).json({ message: 'Not authorized' });

    comment.isDeleted = true;
    await comment.save();

    const Model = comment.parentType === 'post' ? StackPost
      : comment.parentType === 'showcase' ? Showcase
      : CollabThread;

    let totalDeleted = 1;

    if (!comment.parentComment) {
      const replies = await StackComment.find({
        parentComment: comment._id,
        isDeleted: false
      });
      if (replies.length > 0) {
        totalDeleted += replies.length;
        await StackComment.updateMany(
          { _id: { $in: replies.map(r => r._id) } },
          { isDeleted: true }
        );
      }
    }

    await Model.findByIdAndUpdate(comment.parentId, {
      $inc: { commentCount: -totalDeleted }
    });

    res.json({ message: 'Comment deleted', totalDeleted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stack-suite/comments/:id  (auth — author only)
const updateComment = async (req, res) => {
  try {
    const comment = await StackComment.findById(req.params.id);
    if (!comment || comment.isDeleted) return res.status(404).json({ message: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString())
      return res.status(401).json({ message: 'Not authorized' });

    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ message: 'Content is required' });

    comment.content = content.trim();
    await comment.save();
    await comment.populate('author', 'name avatarUrl role');

    const shaped = {
      ...comment.toObject(),
      upvoteCount: comment.upvotes.length,
      likeCount: comment.likes.length,
      time: timeAgo(comment.createdAt),
      isUpvoted: req.user ? comment.upvotes.some(id => id.toString() === req.user._id.toString()) : false,
      isLiked: req.user ? comment.likes.some(id => id.toString() === req.user._id.toString()) : false,
      replies: []
    };

    // Emit update to room
    try {
      const socketUtil = require('../utils/socket');
      const io = socketUtil.getIo();
      if (io) {
        io.to(`stacksuite:${comment.parentId}`).emit('stacksuite_comment_updated', { parentType: comment.parentType, parentId: comment.parentId, comment: shaped });
      }
    } catch (e) { console.error('Socket emit error (stacksuite comment update):', e); }

    res.json(shaped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Get all bookmarked items for the logged-in user
 * @route   GET /api/stack-suite/bookmarks
 * @access  Private
 */
const getBookmarks = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.bookmarks || user.bookmarks.length === 0) {
      return res.json([]);
    }

    const itemPromises = user.bookmarks.map(async (b) => {
      let item = null;
      if (b.itemType === 'post') {
        item = await StackPost.findById(b.itemId).populate('author', 'name avatarUrl role headline').lean();
      } else if (b.itemType === 'showcase') {
        item = await Showcase.findById(b.itemId).populate('founder', 'name avatarUrl role headline').lean();
      } else if (b.itemType === 'collabThread') {
        item = await CollabThread.findById(b.itemId).populate('author', 'name avatarUrl role headline').lean();
      }

      if (!item || item.isDeleted) return null;

      return {
        ...item,
        bookmarkType: b.itemType,
        time: timeAgo(item.createdAt),
        upvoteCount: item.upvotes ? item.upvotes.length : 0,
        isUpvoted: item.upvotes ? item.upvotes.some(id => id.toString() === req.user._id.toString()) : false,
      };
    });

    const items = (await Promise.all(itemPromises)).filter(Boolean);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════ */

// GET /api/stack-suite/stats
const getStats = async (req, res) => {
  try {
    const [
      totalPosts,
      totalShowcases,
      totalCollabThreads,
      totalBuildInPublic,
      totalFounderMatches,
      totalChallenges,
      totalAccountability,
      totalMembers,
      onlineNow
    ] = await Promise.all([
      StackPost.countDocuments({ isDeleted: false }),
      Showcase.countDocuments({ isDeleted: false }),
      CollabThread.countDocuments({ isDeleted: false }),
      StackPost.countDocuments({ contentType: 'build-in-public', isDeleted: false }),
      StackPost.countDocuments({ contentType: 'founder-matching', isDeleted: false }),
      StackPost.countDocuments({ contentType: 'challenge', isDeleted: false }),
      StackPost.countDocuments({ contentType: 'accountability', isDeleted: false }),
      User.countDocuments({}),
      User.countDocuments({ isOnline: true })
    ]);

    res.json({
      totalPosts,
      totalValidations: 0,
      totalShowcases,
      totalCollabThreads,
      totalBuildInPublic,
      totalFounderMatches,
      totalChallenges,
      totalAccountability,
      totalMembers,
      onlineNow,
      totalDiscussion: totalPosts - totalBuildInPublic - totalFounderMatches - totalChallenges - totalAccountability
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stack-suite/collab/:id/upvote
const upvoteCollab = async (req, res) => {
  try {
    const thread = await CollabThread.findById(req.params.id);
    if (!thread || thread.isDeleted) return res.status(404).json({ message: 'Thread not found' });

    const uid = req.user._id.toString();
    const idx = thread.upvotes.findIndex(id => id.toString() === uid);
    const downIdx = thread.downvotes.findIndex(id => id.toString() === uid);
    if (downIdx > -1) thread.downvotes.splice(downIdx, 1);
    
    if (idx > -1) { thread.upvotes.splice(idx, 1); } else { thread.upvotes.push(req.user._id); }
    await thread.save();
    res.json({ upvoteCount: thread.upvotes.length, downvoteCount: thread.downvotes.length, isUpvoted: idx === -1, isDownvoted: false });
    try {
      const socketUtil = require('../utils/socket');
      const io = socketUtil.getIo();
      if (io) io.to(`stacksuite:collab:${thread._id}`).emit('stacksuite_collab_vote_update', { threadId: thread._id, upvoteCount: thread.upvotes.length, downvoteCount: thread.downvotes.length });
    } catch (e) { console.error('Socket emit error (collab upvote):', e); }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stack-suite/collab/:id/downvote
const downvoteCollab = async (req, res) => {
  try {
    const thread = await CollabThread.findById(req.params.id);
    if (!thread || thread.isDeleted) return res.status(404).json({ message: 'Thread not found' });

    const uid = req.user._id.toString();
    const idx = thread.downvotes.findIndex(id => id.toString() === uid);
    const upIdx = thread.upvotes.findIndex(id => id.toString() === uid);
    if (upIdx > -1) thread.upvotes.splice(upIdx, 1);
    
    if (idx > -1) { thread.downvotes.splice(idx, 1); } else { thread.downvotes.push(req.user._id); }
    await thread.save();
    res.json({ upvoteCount: thread.upvotes.length, downvoteCount: thread.downvotes.length, isDownvoted: idx === -1, isUpvoted: false });
    try {
      const socketUtil = require('../utils/socket');
      const io = socketUtil.getIo();
      if (io) io.to(`stacksuite:collab:${thread._id}`).emit('stacksuite_collab_vote_update', { threadId: thread._id, upvoteCount: thread.upvotes.length, downvoteCount: thread.downvotes.length });
    } catch (e) { console.error('Socket emit error (collab downvote):', e); }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getPosts, getPostById, createPost, updatePost, upvotePost, downvotePost, deletePost,
  toggleFollowPost, toggleJoinChallenge, updateChallengeProgress, toggleEncourageAccountability,
  getShowcases, getShowcaseById, createShowcase, updateShowcase, deleteShowcase, upvoteShowcase, downvoteShowcase,
  getCollabThreads, getCollabThreadById, createCollabThread, updateCollabThread, deleteCollabThread, upvoteCollab, downvoteCollab,
  getComments, addComment, upvoteComment, likeComment, deleteComment, updateComment,
  getBookmarks, getStats,
  followShowcase, unfollowShowcase, followCollab, unfollowCollab,
};
module.exports.followPost = followPost;
module.exports.unfollowPost = unfollowPost;

