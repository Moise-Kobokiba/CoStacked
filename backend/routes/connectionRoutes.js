// backend/routes/connectionRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Connection = require('../models/Connection'); // adjust path if different

// Import all the controller functions we created
const {
  getConnectionStatus,
  sendRequest,
  acceptRequest,
  removeOrCancelConnection,
  getConnections,
  getPendingRequests,
  getConnectionCount,
} = require('../controllers/connectionController');

// All connection routes are protected and require a user to be logged in.

// GET Routes
router.route('/').get(protect, getConnections); // Get all of my connections
router.route('/pending').get(protect, getPendingRequests); // Get all pending requests I have received
router.route('/status/:userId').get(protect, getConnectionStatus); // Get my connection status with a specific user

// POST Route
router.route('/request').post(protect, sendRequest); // Send a new connection request

// PUT Route
router.route('/accept').put(protect, acceptRequest); // Accept a received request

// DELETE Route
router.route('/:userId').delete(protect, removeOrCancelConnection); // Remove a connection, or cancel/decline a request

router.get('/count/:userId', getConnectionCount);

module.exports = router;