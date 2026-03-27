// backend/routes/stackSuiteRoutes.js

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  getPosts, getPostById, createPost, upvotePost, deletePost,
  getShowcases, getShowcaseById, createShowcase, upvoteShowcase,
  getCollabThreads, getCollabThreadById, createCollabThread,
  getComments, addComment, upvoteComment, likeComment, deleteComment,
} = require('../controllers/stackSuiteController');

// ── Optional auth: attach user if token present, but don't block public reads ──
const optionalProtect = (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer')) {
    const jwt  = require('jsonwebtoken');
    const User = require('../models/User');
    const token = auth.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (!err && decoded) {
        try { req.user = await User.findById(decoded.id).select('-password'); } catch (_) {}
      }
      next();
    });
  } else {
    next();
  }
};

/* ─── Posts / Discussions ─── */
router.route('/posts')
  .get(optionalProtect, getPosts)
  .post(protect, createPost);

router.route('/posts/:id')
  .get(optionalProtect, getPostById)
  .delete(protect, deletePost);

router.put('/posts/:id/upvote', protect, upvotePost);

/* ─── Showcases ─── */
router.route('/showcases')
  .get(optionalProtect, getShowcases)
  .post(protect, createShowcase);

router.route('/showcases/:id')
  .get(optionalProtect, getShowcaseById);

router.put('/showcases/:id/upvote', protect, upvoteShowcase);

/* ─── Collab Threads ─── */
router.route('/collab')
  .get(optionalProtect, getCollabThreads)
  .post(protect, createCollabThread);

router.route('/collab/:id')
  .get(optionalProtect, getCollabThreadById);

/* ─── Comments (shared) ─── */
router.route('/comments/:parentType/:parentId')
  .get(optionalProtect, getComments)
  .post(protect, addComment);

router.put('/comments/:id/upvote', protect, upvoteComment);
router.put('/comments/:id/like',   protect, likeComment);
router.delete('/comments/:id',     protect, deleteComment);

module.exports = router;
