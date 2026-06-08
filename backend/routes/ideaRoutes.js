const express = require('express');
const router = express.Router();
const {
  getIdeas,
  getIdeaById,
  createIdea,
  updateIdea,
  voteIdea,
  convertIdeaToProject,
  deleteIdea,
  getIdeaComments,
  addIdeaComment,
  deleteIdeaComment,
  editIdeaComment
} = require('../controllers/ideaController');
const { protect } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { validationResult } = require('express-validator');

// Simple middleware to return validation errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

router.route('/')
    .get(getIdeas)
    .post(protect, createIdea);

router.route('/:id')
    .get(getIdeaById)
    .put(protect, updateIdea)
    .delete(protect, deleteIdea);

router.route('/:id/vote').post(protect, body('voteType').isIn(['up','down']), validate, voteIdea);
router.route('/:id/convert').post(protect, convertIdeaToProject);
router.route('/:id/view').post(incrementIdeaViewCount);
router.route('/:id/share').post(shareIdea);

// Comment routes
router.route('/:id/comments')
    .get(getIdeaComments)
    .post(protect, body('content').isLength({ min: 1 }).withMessage('Comment content is required'), validate, addIdeaComment);

router.route('/:id/comments/:commentId')
    .delete(protect, deleteIdeaComment)
    .put(protect, editIdeaComment);

router.route('/:id/comments/:commentId/like').post(protect, likeIdeaComment);

module.exports = router;
