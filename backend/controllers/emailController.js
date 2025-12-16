const { sendVerificationEmail } = require('../mailer'); // backend mailer.js
const User = require('../models/User');

const sendVerification = async (req, res) => {
  try {
    const { userId, verificationToken } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationLink = `${FRONTEND_URL}/verify?token=${verificationToken}`;

    await sendVerificationEmail(user.email, verificationLink);

    res.status(200).json({ message: 'Verification email sent' });
  } catch (err) {
    console.error('Send verification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { sendVerification };