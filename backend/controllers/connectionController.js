// backend/controllers/connectionController.js

const Connection = require('../models/Connection');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Interest = require('../models/Interest');

// @desc    Get the connection status with another user
// @route   GET /api/connections/status/:userId
const getConnectionStatus = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const otherUserId = req.params.userId;

    const connection = await Connection.findOne({
      $or: [
        { requester: loggedInUserId, recipient: otherUserId },
        { requester: otherUserId, recipient: loggedInUserId },
      ],
    });

    // 1. Check direct connection status
    if (connection) {
      if (connection.status === 'accepted') {
        return res.json({ status: 'connected' });
      }
      if (connection.status === 'pending') {
        if (connection.requester.toString() === loggedInUserId.toString()) {
          return res.json({ status: 'pending_sent' });
        } else {
          return res.json({ status: 'pending_received' });
        }
      }
    }

    // 2. Check for Project Collaboration (Approved Interest)
    // If no direct connection (or connection is not accepted/pending?), check if they are working together.
    // Note: We prioritize direct connection status if it exists and is pending, to allow handling that request.
    // But if connection is missing or somehow declined (removed), we check interest.
    
    const collaboration = await Interest.findOne({
      $or: [
        { senderId: loggedInUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: loggedInUserId },
      ],
      status: 'approved'
    });

    if (collaboration) {
      return res.json({ status: 'connected' });
    }

    res.json({ status: 'not_connected' });
  } catch (error) { 
    console.error(`[GET CONNECTION STATUS ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server Error' }); 
  }
};


// @desc    Send a connection request
// @route   POST /api/connections/request
const sendRequest = async (req, res) => {
  try {
    const recipientId = req.body.recipientId;
    const requesterId = req.user._id;

    if (recipientId.toString() === requesterId.toString()) {
      return res.status(400).json({ message: 'You cannot connect with yourself.' });
    }

    // Check if recipient exists and is not an admin
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (recipient.isAdmin) {
      return res.status(403).json({ message: 'You cannot connect with this user.' });
    }

    // Check if a connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existingConnection) {
      return res.status(400).json({ message: 'A connection or request already exists.' });
    }
    
    await Connection.create({ requester: requesterId, recipient: recipientId });

     await Notification.create({
      recipient: recipientId,
      sender: requesterId,
      type: 'NEW_CONNECTION_REQUEST',
    });

    res.status(201).json({ status: 'pending_sent' });
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

// @desc    Accept a connection request
// @route   PUT /api/connections/accept
const acceptRequest = async (req, res) => {
  try {
    const requesterId = req.body.requesterId;
    const recipientId = req.user._id;

    const connection = await Connection.findOneAndUpdate(
      { requester: requesterId, recipient: recipientId, status: 'pending' },
      { status: 'accepted' },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({ message: 'Request not found or already handled.' });
    }

    await Notification.create({
      recipient: requesterId,
      sender: recipientId,
      type: 'CONNECTION_ACCEPTED',
    });

    res.json({ status: 'connected' });
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

// @desc    Decline or cancel a request, or remove a connection
// @route   DELETE /api/connections/:userId
const removeOrCancelConnection = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const otherUserId = req.params.userId;

    const result = await Connection.deleteOne({
      $or: [
        { requester: loggedInUserId, recipient: otherUserId },
        { requester: otherUserId, recipient: loggedInUserId },
      ],
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Connection not found.' });
    }

    res.json({ status: 'not_connected' });
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

/**
 * @desc    Get a user's connections
 * @route   GET /api/connections
 * @access  Private
 */
const getConnections = async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: 'accepted',
    })
    // --- THIS IS THE FIX ---
    // Remove the second argument to populate the FULL user object.
    .populate('requester')
    .populate('recipient');
    
    // Remap data to show the other user, not the logged-in user
    const userConnections = connections
      .map(conn => {
        // Safety check: ensure both users exist (in case of deleted users)
        if (!conn.requester || !conn.recipient) return null;

        const otherUser = conn.requester._id.toString() === req.user._id.toString()
          ? conn.recipient
          : conn.requester;
        return otherUser;
      })
      .filter(user => user !== null && user.isAdmin !== true); // Exclude admin users

    res.json(userConnections);
  } catch (error) {
    console.error(`[GET CONNECTIONS ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get pending connection requests for logged-in user
// @route   GET /api/connections/pending
const getPendingRequests = async (req, res) => {
    try {
        const requests = await Connection.find({
            recipient: req.user._id,
            status: 'pending'
        }).populate('requester', 'name role avatarUrl bio isAdmin');

        // Filter out requests from admin users
        const filteredRequests = requests.filter(request => !request.requester.isAdmin);

        res.json(filteredRequests);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get total count of accepted connections for a user
// @route   GET /api/connections/count/:userId
const getConnectionCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await Connection.countDocuments({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' },
      ],
    });

    res.json({ count });
  } catch (error) {
    console.error(`[GET CONNECTION COUNT ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
};


module.exports = {
  getConnectionStatus,
  sendRequest,
  acceptRequest,
  removeOrCancelConnection,
  getConnections,
  getPendingRequests,
  getConnectionCount,
};