const express = require('express');
const router = express.Router();
const { sendVerification } = require('../controllers/emailController');
const { protect } = require('../middleware/authMiddleware'); // optional auth

router.post('/', protect, sendVerification);

module.exports = router;