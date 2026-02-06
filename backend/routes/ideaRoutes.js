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
  deleteIdeaComment
} = require('../controllers/ideaController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(getIdeas)
    .post(protect, createIdea);

router.route('/:id')
    .get(getIdeaById)
    .put(protect, updateIdea)
    .delete(protect, deleteIdea);

router.route('/:id/vote').post(protect, voteIdea);
router.route('/:id/convert').post(protect, convertIdeaToProject);

// Comment routes
router.route('/:id/comments')
    .get(getIdeaComments)
    .post(protect, addIdeaComment);

router.route('/:id/comments/:commentId')
    .delete(protect, deleteIdeaComment);

module.exports = router;
