const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const {
  getValidationTips,
  createValidationTip,
  updateValidationTip,
  deleteValidationTip,
} = require('../controllers/validationTipController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

const optionalProtect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer')) {
    const token = auth.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded?.id) {
        const user = await User.findById(decoded.id).select('-password');
        if (user) req.user = user;
      }
    } catch (e) {
      // ignore invalid or expired token for public fetch
    }
  }
  next();
};

// Public: fetch manual tips + article-sourced tips
router.get('/', optionalProtect, getValidationTips);

// Admin: manage manual validation tips
router.post('/', protect, requireAdmin, createValidationTip);
router.put('/:id', protect, requireAdmin, updateValidationTip);
router.delete('/:id', protect, requireAdmin, deleteValidationTip);

module.exports = router;
