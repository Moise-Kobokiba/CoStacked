// backend/routes/stackSuiteRoutes.js

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  getPosts, getPostById, createPost, updatePost, upvotePost, downvotePost, deletePost,
  toggleFollowPost, toggleJoinChallenge, updateChallengeProgress, toggleEncourageAccountability,
  getShowcases, getShowcaseById, createShowcase, updateShowcase, deleteShowcase, upvoteShowcase, downvoteShowcase,
  getCollabThreads, getCollabThreadById, createCollabThread, updateCollabThread, deleteCollabThread, upvoteCollab, downvoteCollab,
  getComments, addComment, editComment, upvoteComment, likeComment, deleteComment,
  getBookmarks, getStats,
} = require('../controllers/stackSuiteController');

/* ─── Optional auth: attach user if token present, but don't block public reads ─── */
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

/* ─── Stats ─── */
router.get('/stats', getStats);

/* ─── Bookmarks ─── */
router.get('/bookmarks', protect, getBookmarks);

/* ─── Posts (covers all 7 content types) ─── */
router.route('/posts')
  .get(optionalProtect, getPosts)
  .post(protect, createPost);

router.route('/posts/:id')
  .get(optionalProtect, getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.put('/posts/:id/upvote', protect, upvotePost);
router.put('/posts/:id/downvote', protect, downvotePost);
router.put('/posts/:id/follow', protect, toggleFollowPost);
router.put('/posts/:id/join', protect, toggleJoinChallenge);
router.put('/posts/:id/progress', protect, updateChallengeProgress);
router.put('/posts/:id/encourage', protect, toggleEncourageAccountability);

/* ─── Showcases ─── */
router.route('/showcases')
  .get(optionalProtect, getShowcases)
  .post(protect, createShowcase);

router.route('/showcases/:id')
  .get(optionalProtect, getShowcaseById)
  .put(protect, updateShowcase)
  .delete(protect, deleteShowcase);

router.put('/showcases/:id/upvote', protect, upvoteShowcase);
router.put('/showcases/:id/downvote', protect, downvoteShowcase);

/* ─── Collab Threads ─── */
router.route('/collab')
  .get(optionalProtect, getCollabThreads)
  .post(protect, createCollabThread);

router.route('/collab/:id')
  .get(optionalProtect, getCollabThreadById)
  .put(protect, updateCollabThread)
  .delete(protect, deleteCollabThread);

router.put('/collab/:id/upvote', protect, upvoteCollab);
router.put('/collab/:id/downvote', protect, downvoteCollab);

/* ─── Comments (shared across all content types) ─── */
router.route('/comments/:parentType/:parentId')
  .get(optionalProtect, getComments)
  .post(protect, addComment);

router.put('/comments/:id', protect, editComment);
router.put('/comments/:id/upvote', protect, upvoteComment);
router.put('/comments/:id/like',   protect, likeComment);
router.delete('/comments/:id',     protect, deleteComment);

module.exports = router;
