const express = require('express');
const router = express.Router();
const {
  getValidationTips,
  createValidationTip,
  updateValidationTip,
  deleteValidationTip,
} = require('../controllers/validationTipController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

// Public: fetch manual tips + article-sourced tips
router.get('/', getValidationTips);

// Admin: manage manual validation tips
router.post('/', protect, requireAdmin, createValidationTip);
router.put('/:id', protect, requireAdmin, updateValidationTip);
router.delete('/:id', protect, requireAdmin, deleteValidationTip);

module.exports = router;
