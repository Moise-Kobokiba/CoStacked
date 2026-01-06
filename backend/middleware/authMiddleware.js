// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ensure this matches your file's casing

/**
 * This middleware function checks for a valid JWT in the request headers.
 * If the token is valid and the user exists, it attaches the user's data to the request object.
 * If not, it sends back an authorization error.
 */
const protect = async (req, res, next) => {
  let token;

  // Check if the 'Authorization' header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (e.g., "Bearer eyJhbGciOiJIUz...")
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using our secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by the ID embedded in the token
      const user = await User.findById(decoded.id).select('-password');

      // --- THIS IS THE FIX ---
      // CRITICAL: Check if the user found by the token's ID still exists in the database.
      if (!user) {
        // If the user has been deleted, the token is no longer valid.
        return res.status(401).json({ message: 'Not authorized, user for this token no longer exists' });
      }
      
      // If the user exists, attach their data to the request object.
      req.user = user;
      
      // Continue to the next step in the request-response cycle (e.g., the controller).
      next();
      // --- END FIX ---

    } catch (error) {
      // This will catch errors from jwt.verify if the token is malformed or expired.
      console.error('Token verification failed:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
    // `req.user` is attached by the preceding `protect` middleware.
    if (req.user && req.user.isAdmin) {
        next(); // User is an admin, proceed to the next function.
    } else {
        res.status(403).json({ message: 'Forbidden: Not authorized as an administrator.' });
    }
};

module.exports = { protect, admin };