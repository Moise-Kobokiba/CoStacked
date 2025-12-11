// backend/routes/messageRoutes.js

const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const chatUpload = require('../config/cloudinaryChat'); // <-- 1. IMPORT the chat upload middleware

// Defines GET /api/messages/conversations
router.route('/conversations').get(protect, getConversations);

// Defines GET /api/messages/:conversationId
router.route('/:conversationId').get(protect, getMessages);

// --- THIS IS THE UPDATE ---
// The POST route is now specifically for uploading files.
// It uses the `chatUpload.single('chatFile')` middleware to process the file.
// 'chatFile' is the field name the frontend must use when sending the file data.
router.route('/:conversationId').post(protect, chatUpload.single('chatFile'), sendMessage);

module.exports = router;