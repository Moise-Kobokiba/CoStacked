// backend/controllers/interestController.js

// Ensure the casing of the model import matches your actual filenames
const Interest = require('../models/Interest');

// Access to io for socket emissions
let io;
const setSocketIO = (socketIO) => {
  io = socketIO;
};

module.exports = { setSocketIO };
const Project = require('../models/Project');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification'); // <-- 1. IMPORT Notification model

/**
 * @desc    Create a new interest/connection request
 * @route   POST /api/interests
 * @access  Private (Requires authentication)
 */
const createInterest = async (req, res) => {
  try {
    const { projectId } = req.body;
    const senderId = req.user._id;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required.' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (senderId.toString() === project.founderId.toString()) {
      return res.status(400).json({ message: 'You cannot connect to your own project.' });
    }

    if (await Interest.findOne({ projectId, senderId })) {
      return res.status(400).json({ message: 'You have already shown interest in this project.' });
    }

    const interest = await Interest.create({
      projectId,
      senderId,
      receiverId: project.founderId,
    });

    // --- 2. CREATE A NOTIFICATION for the project founder ---
    await Notification.create({
        recipient: project.founderId,
        sender: senderId,
        type: 'NEW_INTEREST',
        interestId: interest._id,
        projectId: interest.projectId
    });

    res.status(201).json(interest);
  } catch (error) {
    console.error(`[CREATE INTEREST ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while creating interest request.' });
  }
};

/**
 * @desc    Get all interest requests RECEIVED by the logged-in user (for Founders)
 * @route   GET /api/interests/received
 * @access  Private
 */
const getReceivedInterests = async (req, res) => {
  try {
    const interests = await Interest.find({ receiverId: req.user._id })
      .populate('senderId', 'name role avatarUrl')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 });
    res.json(interests);
  } catch (error) {
    console.error(`[GET RECEIVED INTERESTS ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while fetching received interests.' });
  }
};

/**
 * @desc    Get all interest requests SENT by the logged-in user (for Developers)
 * @route   GET /api/interests/sent
 * @access  Private
 */
const getSentInterests = async (req, res) => {
  try {
    const interests = await Interest.find({ senderId: req.user._id })
        .populate('projectId', 'title description skillsNeeded compensation stage founder founderId') 
      .populate('receiverId', 'name')
      .sort({ createdAt: -1 });
    res.json(interests);
  } catch (error) {
    console.error(`[GET SENT INTERESTS ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while fetching sent interests.' });
  }
};

/**
 * @desc    Respond to an interest request (approve/reject)
 * @route   PUT /api/interests/:id/respond
 * @access  Private
 */
const respondToInterest = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'A valid status ("approved" or "rejected") is required.' });
    }

    const interest = await Interest.findById(req.params.id)
        .populate('senderId', 'name')
        .populate('receiverId', 'name')
        .populate('projectId', 'title');

    if (!interest) {
      return res.status(404).json({ message: 'Interest request not found.' });
    }

    if (interest.receiverId._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to respond to this request.' });
    }
    if (interest.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been responded to.' });
    }

    interest.status = status;
    const updatedInterest = await interest.save();

    // --- 3. CREATE A NOTIFICATION for the developer who sent the request ---
    await Notification.create({
        recipient: interest.senderId,
        sender: interest.receiverId,
        type: status === 'approved' ? 'INTEREST_APPROVED' : 'INTEREST_REJECTED',
        interestId: updatedInterest._id,
        projectId: updatedInterest.projectId
    });

    let conversation;
    if (status === 'approved') {
      const participants = [interest.senderId._id, interest.receiverId._id];
      
      let existingConversation = await Conversation.findOne({
        projectId: interest.projectId._id,
        participants: { $all: participants },
      }).populate('participants', 'name role avatarUrl');

      if (!existingConversation) {
        const newConversation = await Conversation.create({
          participants,
          projectId: interest.projectId._id,
        });
        existingConversation = await Conversation.findById(newConversation._id).populate('participants', 'name role avatarUrl');
      }
      conversation = existingConversation;
    }
    
    const responsePayload = updatedInterest.toObject();
    if (conversation) {
      responsePayload.conversation = conversation;
    }

    res.json(responsePayload);

  } catch (error) {
    console.error(`[RESPOND TO INTEREST ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while responding to interest.' });
  }
};

/**
 * @desc    Delete an interest/connection by its ID
 * @route   DELETE /api/interests/:id
 * @access  Private
 */
const deleteInterest = async (req, res) => {
  try {
    const interest = await Interest.findById(req.params.id);

    if (!interest) {
      return res.status(404).json({ message: 'Connection not found.' });
    }

    const isParticipant = interest.senderId.toString() === req.user._id.toString() ||
                        interest.receiverId.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(401).json({ message: 'User not authorized to modify this connection.' });
    }

    await Interest.deleteOne({ _id: req.params.id });

    res.json({ message: 'Connection has been successfully removed.' });

  } catch (error) {
    console.error(`[DELETE INTEREST ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while deleting connection.' });
  }
};

module.exports = { 
  createInterest,
  getReceivedInterests,
  respondToInterest,
  getSentInterests,
  deleteInterest,
};