// backend/routes/conversationRoutes.js
const express = require('express');
const router = express.Router();
const { accessOrCreateConversation } = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/access').post(protect, accessOrCreateConversation);

module.exports = router;