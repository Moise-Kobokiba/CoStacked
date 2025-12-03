// backend/controllers/messageController.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

/**
 * @desc    Get all conversations for the logged-in user
 * @route   GET /api/messages/conversations
 * @access  Private
 */
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name role avatarUrl')
      // --- THIS IS THE UPDATE ---
      // Populate the 'projectId' field, but only select the 'title' for efficiency.
      .populate('projectId', 'title') 
      .sort({ updatedAt: -1 }); // Sort by most recent activity
    res.json(conversations);
  } catch (error) {
    console.error(`[GET CONVERSATIONS ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while fetching conversations.' });
  }
};

/**
 * @desc    Get all messages for a specific conversation
 * @route   GET /api/messages/:conversationId
 * @access  Private
 */
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(401).json({ message: 'Not authorized to view this conversation.' });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'name avatarUrl');
    res.json(messages);
  } catch (error) {
    console.error(`[GET MESSAGES ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while fetching messages.' });
  }
};

/**
 * @desc    Send a new message to a conversation
 * @route   POST /api/messages/:conversationId
 * @access  Private
 */
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Message text cannot be empty.' });
    }
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(401).json({ message: 'Not authorized to send messages to this conversation.' });
    }

    const message = await Message.create({
      conversationId,
      text,
      sender: req.user._id,
    });
    
    conversation.updatedAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
                                          .populate('sender', 'name avatarUrl');

    // Create a notification for the other user in the conversation
    const recipientId = conversation.participants.find(p => p.toString() !== req.user._id.toString());

    if (recipientId) {
      await Notification.create({
        recipient: recipientId,
        sender: req.user._id,
        type: 'NEW_MESSAGE',
        conversationId: conversation._id,
        projectId: conversation.projectId 
      });
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error(`[SEND MESSAGE ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while sending message.' });
  }
};

module.exports = { getConversations, getMessages, sendMessage };