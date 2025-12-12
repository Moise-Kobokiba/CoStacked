// backend/controllers/messageController.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

/**
 * @desc    Get or create a direct conversation between the logged-in user and a target user
 * @route   POST /api/messages/access
 * @access  Private
 */
const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'UserId param not sent with request' });
    }

    // Check if a direct conversation already exists
    let isChat = await Conversation.find({
      isDirectMessage: true,
      $and: [
        { participants: { $elemMatch: { $eq: req.user._id } } },
        { participants: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('participants', 'name role avatarUrl')
      .populate('projectId', 'title');

    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      // Create a new direct conversation
      var chatData = {
        participants: [req.user._id, userId],
        isDirectMessage: true,
      };

      try {
        const createdChat = await Conversation.create(chatData);
        const fullChat = await Conversation.findOne({ _id: createdChat._id }).populate(
          'participants',
          'name role avatarUrl'
        );
        res.status(200).json(fullChat);
      } catch (error) {
        res.status(400);
        throw new Error(error.message);
      }
    }
  } catch (error) {
    console.error(`[ACCESS CHAT ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while accessing chat.' });
  }
};

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
 * @desc    Send a new message (Text or Media) to a conversation
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

    let messageType = 'text';
    let content = '';
    let metadata = {};

    // check if file exists (media message)
    if (req.file) {
      messageType = req.file.mimetype.startsWith('image/') ? 'image'
        : req.file.mimetype.startsWith('audio/') ? 'audio'
        : 'file';
      content = req.file.path; // Cloudinary URL
      metadata = {
        name: req.file.originalname,
        size: req.file.size,
        format: req.file.mimetype,
      };
    } else if (req.body.content) {
      // check if text content exists (text message)
      messageType = 'text';
      content = req.body.content;
    } else {
      return res.status(400).json({ message: 'No content provided for message.' });
    }

    const message = await Message.create({
      conversationId,
      sender,
      type: messageType,
      content: content,
      metadata: metadata || undefined
    });
    
    // Update conversation timestamp
    conversation.updatedAt = new Date();
    await conversation.save();

    // Populate sender details for return
    const populatedMessage = await Message.findById(message._id)
                                          .populate('sender', 'name avatarUrl');

    // Create notification for other participant(s)
    // Filter out sender
    const recipients = conversation.participants.filter(p => p.toString() !== sender.toString());

    // In a group chat (if supported later), we might notify multiple. For now assuming 1-on-1 mostly.
    for (const recipientId of recipients) {
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
    console.error(`[SEND MESSAGE ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while sending message.' });
  }
};

module.exports = { getConversations, getMessages, sendMessage, accessChat };