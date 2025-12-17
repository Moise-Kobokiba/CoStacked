// routes/emailRoutes.js
const express = require('express');
const router = express.Router();
const { sendVerificationEmail } = require('../utils/sendEmail');
const User = require('../models/User');

router.post('/', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const verificationToken = user.emailVerificationToken || crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 24*60*60*1000; // 24h
    await user.save();

    const verificationLink = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
    await sendVerificationEmail(user.email, verificationLink);

    res.status(200).json({ message: 'Verification email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send verification email' });
  }
});

module.exports = router;