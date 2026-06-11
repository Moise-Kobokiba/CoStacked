// backend/routes/savedItemRoutes.js

const express = require('express');
const router = express.Router();
const {
  getSavedItems,
  saveItem,
  unsaveItem,
  unsaveItemByType,
  checkSaved,
} = require('../controllers/savedItemController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getSavedItems)
  .post(protect, saveItem);

router.route('/check/:itemType/:itemId').get(protect, checkSaved);

router.route('/by-type').delete(protect, unsaveItemByType);

router.route('/:id').delete(protect, unsaveItem);

module.exports = router;