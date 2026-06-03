// backend/controllers/connectionController.js

const User = require('../models/User');

// Send connection request
const sendConnectionRequest = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const senderId = req.user._id;

    if (senderId.toString() === targetUserId) {
      return res.status(400).json({ message: 'Cannot send connection request to yourself' });
    }

    const [sender, targetUser] = await Promise.all([
      User.findById(senderId),
      User.findById(targetUserId)
    ]);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already connected
    if (sender.connections.includes(targetUserId)) {
      return res.status(400).json({ message: 'Already connected with this user' });
    }

    // Check if request already sent
    if (sender.sentRequests.includes(targetUserId)) {
      return res.status(400).json({ message: 'Connection request already sent' });
    }

    // Check if you have a pending request from this user
    if (sender.connectionRequests.includes(targetUserId)) {
      return res.status(400).json({ message: 'This user has already sent you a connection request' });
    }

    // Add to sender's sent requests
    sender.sentRequests.push(targetUserId);
    await sender.save();

    // Add to target user's connection requests
    targetUser.connectionRequests.push(senderId);
    await targetUser.save();

    res.status(200).json({ 
      message: 'Connection request sent successfully',
      isPending: true
    });

  } catch (error) {
    console.error('Send connection request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept connection request
const acceptConnectionRequest = async (req, res) => {
  try {
    const { senderId } = req.body;
    const receiverId = req.user._id;

    const [receiver, sender] = await Promise.all([
      User.findById(receiverId),
      User.findById(senderId)
    ]);

    if (!sender) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if request exists
    if (!receiver.connectionRequests.includes(senderId)) {
      return res.status(400).json({ message: 'No connection request found from this user' });
    }

    // Remove from connection requests
    receiver.connectionRequests = receiver.connectionRequests.filter(
      id => id.toString() !== senderId
    );

    // Remove from sent requests
    sender.sentRequests = sender.sentRequests.filter(
      id => id.toString() !== receiverId
    );

    // Add to connections for both users
    if (!receiver.connections.includes(senderId)) {
      receiver.connections.push(senderId);
    }
    if (!sender.connections.includes(receiverId)) {
      sender.connections.push(receiverId);
    }

    await Promise.all([receiver.save(), sender.save()]);

    res.status(200).json({ 
      message: 'Connection request accepted',
      isConnected: true
    });

  } catch (error) {
    console.error('Accept connection request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Decline connection request
const declineConnectionRequest = async (req, res) => {
  try {
    const { senderId } = req.body;
    const receiverId = req.user._id;

    const [receiver, sender] = await Promise.all([
      User.findById(receiverId),
      User.findById(senderId)
    ]);

    // Remove from connection requests
    receiver.connectionRequests = receiver.connectionRequests.filter(
      id => id.toString() !== senderId
    );

    // Remove from sent requests
    sender.sentRequests = sender.sentRequests.filter(
      id => id.toString() !== receiverId
    );

    await Promise.all([receiver.save(), sender.save()]);

    res.status(200).json({ message: 'Connection request declined' });

  } catch (error) {
    console.error('Decline connection request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove connection
const removeConnection = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user._id;

    const [user, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId)
    ]);

    // Remove from connections for both users
    user.connections = user.connections.filter(
      id => id.toString() !== targetUserId
    );
    targetUser.connections = targetUser.connections.filter(
      id => id.toString() !== userId
    );

    await Promise.all([user.save(), targetUser.save()]);

    res.status(200).json({ message: 'Connection removed successfully' });

  } catch (error) {
    console.error('Remove connection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel sent request
const cancelSentRequest = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user._id;

    const [user, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId)
    ]);

    // Remove from sender's sent requests
    user.sentRequests = user.sentRequests.filter(
      id => id.toString() !== targetUserId
    );

    // Remove from target's connection requests
    targetUser.connectionRequests = targetUser.connectionRequests.filter(
      id => id.toString() !== userId
    );

    await Promise.all([user.save(), targetUser.save()]);

    res.status(200).json({ message: 'Connection request cancelled' });

  } catch (error) {
    console.error('Cancel sent request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get connection status
const getConnectionStatus = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);

    let status = 'not_connected';
    
    if (user.connections.includes(targetUserId)) {
      status = 'connected';
    } else if (user.sentRequests.includes(targetUserId)) {
      status = 'pending';
    } else if (user.connectionRequests.includes(targetUserId)) {
      status = 'request_received';
    }

    res.status(200).json({ status });

  } catch (error) {
    console.error('Get connection status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  removeConnection,
  cancelSentRequest,
  getConnectionStatus
};