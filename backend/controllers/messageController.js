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
      .populate('projectId', 'title') 
      .sort({ updatedAt: -1 });
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
 * @desc    Send a new FILE/MEDIA message to a conversation
 * @route   POST /api/messages/:conversationId
 * @access  Private
 */
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const sender = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(sender)) {
      return res.status(401).json({ message: 'Not authorized to send messages to this conversation.' });
    }

    // `req.file` is populated by the 'cloudinaryChat' middleware
    if (!req.file) {
      return res.status(400).json({ message: 'No file was uploaded.' });
    }
    
    // Determine the message type based on the file's mimetype
    const messageType = req.file.mimetype.startsWith('image/') ? 'image'
                      : req.file.mimetype.startsWith('audio/') ? 'audio'
                      : 'file';

    const message = await Message.create({
      conversationId,
      sender,
      type: messageType,
      content: req.file.path, // This is the secure URL from Cloudinary
      metadata: {
        name: req.file.originalname,
        size: req.file.size,
        format: req.file.mimetype,
      }
    });
    
    // Asynchronously update the conversation's timestamp to sort it as most recent
    conversation.updatedAt = new Date();
    await conversation.save();

    // After saving the message, we need to populate it with sender details
    // to ensure the data structure is consistent with what Socket.IO will send.
    const populatedMessage = await Message.findById(message._id)
                                          .populate('sender', 'name avatarUrl');

    // Create a notification for the other user in the conversation
    const recipientId = conversation.participants.find(p => p.toString() !== sender.toString());

    if (recipientId) {
      await Notification.create({
        recipient: recipientId,
        sender,
        type: 'NEW_MESSAGE',
        conversationId: conversation._id,
        projectId: conversation.projectId 
      });
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error(`[SEND FILE MESSAGE ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while sending file.' });
  }
};

module.exports = { getConversations, getMessages, sendMessage };