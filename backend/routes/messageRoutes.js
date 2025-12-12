// backend/routes/messageRoutes.js

const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage, accessChat } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const chatUpload = require('../config/cloudinaryChat'); 

// Defines POST /api/messages/access to get or create a direct chat
router.route('/access').post(protect, accessChat);

// Defines GET /api/messages/conversations
router.route('/conversations').get(protect, getConversations);

// Defines GET /api/messages/:conversationId
router.route('/:conversationId').get(protect, getMessages);

// Defines POST /api/messages/:conversationId to send a message (File or Text)
router.route('/:conversationId').post(protect, chatUpload.single('chatFile'), sendMessage);

module.exports = router;