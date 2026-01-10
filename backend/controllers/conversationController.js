// backend/controllers/conversationController.js
const Conversation = require('../models/Conversation');
const Connection = require('../models/Connection');

/**
 * @desc    Find or create a direct message conversation with a connected user.
 * @route   POST /api/conversations/access
 * @access  Private
 */
const accessOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.body; // The ID of the user we want to chat with
    const loggedInUserId = req.user._id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    // 1. Verify that an accepted connection exists between the two users
    const connection = await Connection.findOne({
      status: 'accepted',
      $or: [
        { requester: loggedInUserId, recipient: userId },
        { requester: userId, recipient: loggedInUserId },
      ],
    });

    if (!connection) {
      return res.status(403).json({ message: 'You must be connected with this user to send a message.' });
    }

    const participants = [loggedInUserId, userId];

    // 2. Try to find an existing direct message conversation
    let conversation = await Conversation.findOne({
      isDirectMessage: true,
      participants: { $all: participants },
    })
    .populate('participants', '-password'); // Populate user data

    // 3. If no conversation exists, create one
    if (!conversation) {
      const newConversation = await Conversation.create({
        participants,
        isDirectMessage: true,
      });
      conversation = await Conversation.findById(newConversation._id).populate('participants', '-password');
    }

    res.status(200).json(conversation);

  } catch (error) {
    console.error(`[ACCESS CONVO ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while accessing conversation.' });
  }
};

module.exports = { accessOrCreateConversation };