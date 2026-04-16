// backend/controllers/stackSuiteController.js

const StackPost    = require('../models/StackPost');
const Showcase     = require('../models/Showcase');
const CollabThread = require('../models/CollabThread');
const StackComment = require('../models/StackComment');

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

/* ═══════════════════════════════════════════════
   STACK POSTS (DISCUSSIONS)
═══════════════════════════════════════════════ */

// GET /api/stack-suite/posts
const getPosts = async (req, res) => {
  try {
    const { category, sort, search, phase } = req.query;
    let query = { isDeleted: false };
    if (category && category !== 'all') query.category = category;
    if (phase && phase !== 'all') query.phase = phase;
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
      .populate('author', 'name avatarUrl role')
      .sort(sortOpt)
      .lean();

    const shaped = posts.map(p => ({
      ...p,
      upvoteCount: p.upvotes.length,
      time: timeAgo(p.createdAt),
      isUpvoted: req.user ? p.upvotes.some(id => id.toString() === req.user._id.toString()) : false,
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
      .populate('author', 'name avatarUrl role')
      .lean();
    if (!post || post.isDeleted) return res.status(404).json({ message: 'Post not found' });

    // Increment view count
    await StackPost.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    res.json({
      ...post,
      upvoteCount: post.upvotes.length,
      time: timeAgo(post.createdAt),
      isUpvoted: req.user ? post.upvotes.some(id => id.toString() === req.user._id.toString()) : false,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/stack-suite/posts  (auth required)
const createPost = async (req, res) => {
  try {
    const { title, body, category, tags, phase, confidenceScore } = req.body;
    if (!title || !body) return res.status(400).json({ message: 'Title and body are required' });

    const tagList = typeof tags === 'string'
      ? tags.split(',').map(t => t.trim()).filter(Boolean)
      : Array.isArray(tags) ? tags : [];

    const post = await StackPost.create({
      author: req.user._id,
      title,
      body,
      category: category || 'General',
      tags: tagList,
      phase: phase || 'General',
      confidenceScore: confidenceScore || 0,
    });

    await post.populate('author', 'name avatarUrl role');
    const p = post.toObject();
    res.status(201).json({ ...p, upvoteCount: 0, time: 'just now', isUpvoted: false });
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
    if (idx > -1) {
      post.upvotes.splice(idx, 1); // toggle off
    } else {
      post.upvotes.push(req.user._id);
    }
    await post.save();
    res.json({ upvoteCount: post.upvotes.length, isUpvoted: idx === -1 });
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

    const showcases = await Showcase.find(query)
      .populate('founder', 'name avatarUrl role')
      .sort({ createdAt: -1 })
      .lean();

    const shaped = showcases.map(s => ({
      ...s,
      upvoteCount: s.upvotes.length,
      time: timeAgo(s.createdAt),
      isUpvoted: req.user ? s.upvotes.some(id => id.toString() === req.user._id.toString()) : false,
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
      .populate('founder', 'name avatarUrl role')
      .lean();
    if (!s || s.isDeleted) return res.status(404).json({ message: 'Showcase not found' });
    res.json({
      ...s,
      upvoteCount: s.upvotes.length,
      time: timeAgo(s.createdAt),
      isUpvoted: req.user ? s.upvotes.some(id => id.toString() === req.user._id.toString()) : false,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/stack-suite/showcases  (auth)
const createShowcase = async (req, res) => {
  try {
    const { name, description, longDescription, stage, techStack, looking, teamSize, launched, icon, gradient } = req.body;
    if (!name || !description) return res.status(400).json({ message: 'Name and description are required' });

    const toArr = v => (typeof v === 'string' ? v.split(',').map(x => x.trim()).filter(Boolean) : Array.isArray(v) ? v : []);

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
    });

    await showcase.populate('founder', 'name avatarUrl role');
    const s = showcase.toObject();
    res.status(201).json({ ...s, upvoteCount: 0, time: 'just now', isUpvoted: false });
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
    if (idx > -1) { showcase.upvotes.splice(idx, 1); } else { showcase.upvotes.push(req.user._id); }
    await showcase.save();
    res.json({ upvoteCount: showcase.upvotes.length, isUpvoted: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/stack-suite/showcases/:id  (auth)
const updateShowcase = async (req, res) => {
  try {
    const showcase = await Showcase.findById(req.params.id);
    if (!showcase || showcase.isDeleted) return res.status(404).json({ message: 'Showcase not found' });
    if (showcase.founder.toString() !== req.user._id.toString())
      return res.status(401).json({ message: 'Not authorized' });

    const toArr = v => (typeof v === 'string' ? v.split(',').map(x => x.trim()).filter(Boolean) : Array.isArray(v) ? v : []);

    const { name, description, longDescription, stage, techStack, looking, teamSize, launched, icon, gradient } = req.body;
    
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

    await showcase.save();
    await showcase.populate('founder', 'name avatarUrl role');
    
    res.json({ ...showcase.toObject(), upvoteCount: showcase.upvotes.length, time: timeAgo(showcase.createdAt), isUpvoted: showcase.upvotes.some(id => id.toString() === req.user._id.toString()) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/stack-suite/showcases/:id  (auth — author only)
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

    const threads = await CollabThread.find(query)
      .populate('author', 'name avatarUrl role')
      .sort({ createdAt: -1 })
      .lean();

    res.json(threads.map(t => ({ ...t, time: timeAgo(t.createdAt) })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/stack-suite/collab/:id
const getCollabThreadById = async (req, res) => {
  try {
    const t = await CollabThread.findById(req.params.id)
      .populate('author', 'name avatarUrl role')
      .lean();
    if (!t || t.isDeleted) return res.status(404).json({ message: 'Thread not found' });
    res.json({ ...t, time: timeAgo(t.createdAt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/stack-suite/collab  (auth)
const createCollabThread = async (req, res) => {
  try {
    const { project, milestone, description, longDescription, team, progress, attachment, branch, deadline } = req.body;
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
    });

    await thread.populate('author', 'name avatarUrl role');
    const t = thread.toObject();
    res.status(201).json({ ...t, time: 'just now' });
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

    const { project, milestone, description, longDescription, team, progress, attachment, branch, deadline } = req.body;
    
    if (project) thread.project = project;
    if (milestone) thread.milestone = milestone;
    if (description) thread.description = description;
    if (longDescription !== undefined) thread.longDescription = longDescription;
    if (team !== undefined) thread.team = Array.isArray(team) ? team : [];
    if (progress) thread.progress = progress;
    if (attachment !== undefined) thread.attachment = attachment;
    if (branch !== undefined) thread.branch = branch;
    if (deadline !== undefined) thread.deadline = deadline;

    await thread.save();
    await thread.populate('author', 'name avatarUrl role');
    res.json({ ...thread.toObject(), time: timeAgo(thread.createdAt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/stack-suite/collab/:id  (auth — author only)
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

/* ═══════════════════════════════════════════════
   STACK COMMENTS (shared across all 3 types)
═══════════════════════════════════════════════ */

// GET /api/stack-suite/comments/:parentType/:parentId
const getComments = async (req, res) => {
  try {
    const { parentType, parentId } = req.params;

    // Top-level comments
    const topLevel = await StackComment.find({
      parentType, parentId,
      parentComment: null,
      isDeleted: false,
    })
      .populate('author', 'name avatarUrl role')
      .sort({ createdAt: -1 })
      .lean();

    // All replies for this parent
    const replies = await StackComment.find({
      parentType, parentId,
      parentComment: { $ne: null },
      isDeleted: false,
    })
      .populate('author', 'name avatarUrl role')
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

    // Validate parentComment belongs to same parent if provided
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

    await comment.populate('author', 'name avatarUrl role');

    // Bump comment count on parent document
    const Model = parentType === 'post' ? StackPost
      : parentType === 'showcase' ? Showcase
      : CollabThread;
    await Model.findByIdAndUpdate(parentId, { $inc: { commentCount: 1 } });

    const c = comment.toObject();
    res.status(201).json({ ...c, upvoteCount: 0, likeCount: 0, time: 'just now', isUpvoted: false, isLiked: false, replies: [] });
  } catch (err) {
    res.status(400).json({ message: err.message });
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

// DELETE /api/stack-suite/comments/:id  (auth — author only)
const deleteComment = async (req, res) => {
  try {
    const comment = await StackComment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString())
      return res.status(401).json({ message: 'Not authorized' });

    // Mark comment as deleted
    comment.isDeleted = true;
    await comment.save();

    // Identify parent models
    const Model = comment.parentType === 'post' ? StackPost
      : comment.parentType === 'showcase' ? Showcase
      : CollabThread;

    let totalDeleted = 1;

    // If it was a top-level comment, logically delete its replies too
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

    // Decrement count on parent
    await Model.findByIdAndUpdate(comment.parentId, { 
      $inc: { commentCount: -totalDeleted } 
    });

    res.json({ message: 'Comment deleted', totalDeleted });
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
        item = await StackPost.findById(b.itemId).populate('author', 'name avatarUrl role').lean();
      } else if (b.itemType === 'showcase') {
        item = await Showcase.findById(b.itemId).populate('founder', 'name avatarUrl role').lean();
      } else if (b.itemType === 'collabThread') {
        item = await CollabThread.findById(b.itemId).populate('author', 'name avatarUrl role').lean();
      }

      if (!item || item.isDeleted) return null;

      // Unify the response structure for the frontend
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

module.exports = {
  getPosts, getPostById, createPost, upvotePost, deletePost,
  getShowcases, getShowcaseById, createShowcase, updateShowcase, deleteShowcase, upvoteShowcase,
  getCollabThreads, getCollabThreadById, createCollabThread, updateCollabThread, deleteCollabThread,
  getComments, addComment, upvoteComment, likeComment, deleteComment,
  getBookmarks,
};

