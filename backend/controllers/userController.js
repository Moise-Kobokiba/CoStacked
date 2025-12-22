// backend/controllers/userController.js

const User = require('../models/User'); // Correct casing
const AdminNotification = require('../models/AdminNotification'); // For admin panel notifications
const TempRegistration = require('../models/TempRegistration');
const generateToken = require('../utils/generateToken');
const { sendEmail } = require('../utils/sendEmail');
const crypto = require('crypto');

/**
 * @desc    Register a new user - send verification email first, then store temporarily
 * @route   POST /api/users/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, bio, skills, location, availability, portfolioLink } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required fields.' });
    }

    if (password.length < 12) {
      return res.status(400).json({ message: 'Password must be at least 12 characters long.' });
    }

    // Check if user already exists
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    // Check if there's already a pending registration for this email
    if (await TempRegistration.findOne({ email })) {
      return res.status(400).json({ message: 'A verification email has already been sent to this email address. Please check your inbox.' });
    }

    // Generate verification token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    // --- EMAIL CONTENT ---
    const textMessage = `Welcome to CoStacked! Your verification code is: ${verificationToken}\n\nThis code will expire in 10 minutes.`;
    const htmlMessage = `<p>Welcome to CoStacked! Your verification code is: <strong>${verificationToken}</strong></p><p>This code will expire in 10 minutes.</p>`;

    // Send verification email FIRST
    try {
      console.log("📧 Sending verification email to:", email);
      await sendEmail({
        to: email,
        subject: 'CoStacked - Verify Your Email Address',
        text: textMessage,
        html: htmlMessage,
      });
      console.log("✅ Verification email sent successfully to:", email);
    } catch (emailError) {
      console.error('❌ EMAIL SENDING FAILED during registration:');
      console.error('Target email:', email);
      console.error('Error message:', emailError.message);
      console.error('Error stack:', emailError.stack);
      console.error('Registration attempt details:', {
        name,
        email,
        role,
        timestamp: new Date().toISOString()
      });

      return res.status(500).json({
        message: 'Could not send verification email. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }

    // Only create temporary registration record if email was sent successfully
    await TempRegistration.create({
      name,
      email,
      password,
      role,
      bio,
      skills: skills ? skills.split(',').map(skill => skill.trim()) : [],
      location,
      availability,
      portfolioLink,
      verificationToken,
    });

    res.status(201).json({
      success: true,
      message: 'Verification email sent! Please check your email and enter the verification code to complete registration.'
    });

  } catch (error) {
    console.error(`[REGISTER ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server Error: Could not process registration.' });
  }
};

/**
 * @desc    Verify user email with OTP and complete registration
 * @route   POST /api/users/verify-email
 * @access  Public
 */
const verifyEmail = async (req, res) => {
    try {
        const { email, token } = req.body;
        if (!email || !token) {
            return res.status(400).json({ message: 'Email and token are required.' });
        }

        // First, check for temporary registration (regular users)
        const tempRegistration = await TempRegistration.findOne({
            email,
            verificationToken: token,
            expiresAt: { $gt: Date.now() }
        });

        if (tempRegistration) {
            // Handle regular user verification
        // Create the actual user account
        const user = await User.create({
            name: tempRegistration.name,
            email: tempRegistration.email,
            password: tempRegistration.password, // Password is already hashed by the model pre-save hook
            role: tempRegistration.role,
            bio: tempRegistration.bio,
            skills: tempRegistration.skills,
            location: tempRegistration.location,
            availability: tempRegistration.availability,
            portfolioLink: tempRegistration.portfolioLink,
            isAdmin: tempRegistration.isAdmin || false, // Set admin flag if this was an admin registration
            isEmailVerified: true
        });

        // Create admin notification
        if (user.isAdmin) {
            await AdminNotification.create({
                type: 'NEW_ADMIN_REGISTERED',
                message: `New admin ${user.name} has joined the platform.`,
                link: `/admin/users`,
                refId: user._id
            });
        } else {
            await AdminNotification.create({
                type: 'NEW_USER_REGISTERED',
                message: `${user.name} has just signed up as a ${user.role}.`,
                link: `/users`,
                refId: user._id
            });
        }

            // Remove the temporary registration record
            await TempRegistration.deleteOne({ _id: tempRegistration._id });

            return res.json({
                success: true,
                message: 'Email verified successfully! Your account has been created. You can now log in.',
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        }

        // If no temp registration found, check for admin user verification
        const adminUser = await User.findOne({
            email,
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() },
            isAdmin: true
        });

        if (adminUser) {
            // Handle admin user verification
            adminUser.isEmailVerified = true;
            adminUser.emailVerificationToken = undefined;
            adminUser.emailVerificationExpires = undefined;
            await adminUser.save({ validateBeforeSave: false });

            // Create admin notification for new admin
            await AdminNotification.create({
                type: 'NEW_ADMIN_REGISTERED',
                message: `New admin ${adminUser.name} has joined the platform.`,
                link: `/admin/users`,
                refId: adminUser._id
            });

            return res.json({
                success: true,
                message: 'Admin email verified successfully! You can now log in.',
                user: {
                    _id: adminUser._id,
                    name: adminUser.name,
                    email: adminUser.email,
                    role: adminUser.role,
                    isAdmin: adminUser.isAdmin
                }
            });
        }

        // If neither found, token is invalid
        return res.status(400).json({ message: 'Invalid or expired verification token.' });

    } catch (error) {
        console.error(`[VERIFY EMAIL ERROR]: ${error.message}`);
        res.status(500).json({ message: 'Server error during email verification.' });
    }
};


/**
 * @desc    Authenticate (log in) a user & get a JWT
 * @route   POST /api/users/login
 * @access  Public
 */
const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      if (!user.isEmailVerified) {
        return res.status(401).json({
          message: 'Email not verified. Please check your inbox for a verification code.',
          emailNotVerified: true
        });
      }

      // Generate JWT token
      const token = generateToken(user._id);

      res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin
        },
        token
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password.' });
    }
  } catch (error) {
    console.error(`[AUTH ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error during authentication.' });
  }
};

/**
 * @desc    Get all users for the public browse page
 * @route   GET /api/users
 * @access  Public
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(`[GET USERS ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server Error: Could not fetch users.' });
  }
};

/**
 * @desc    Get the profile of the currently logged-in user
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    console.error(`[GET PROFILE ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server Error: Could not fetch user profile.' });
  }
};

/**
 * @desc    Update the profile of the currently logged-in user
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.bio = req.body.bio ?? user.bio;
      user.availability = req.body.availability ?? user.availability;
      user.location = req.body.location ?? user.location;
      user.portfolioLink = req.body.portfolioLink ?? user.portfolioLink;
      if (typeof req.body.skills === 'string') {
        user.skills = req.body.skills.split(',').map(skill => skill.trim());
      }
      if (req.body.profileVisibility) {
        user.profileVisibility = req.body.profileVisibility;
      }
      if (req.body.notificationEmails) {
        user.notificationEmails = req.body.notificationEmails;
      }
      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    console.error(`[UPDATE PROFILE ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server Error: Could not update profile.' });
  }
};

/**
 * @desc    Change the user's password
 * @route   PUT /api/users/profile/change-password
 * @access  Private
 */
const changeUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide both current and new passwords.' });
    }
    if (newPassword.length < 12) {
      return res.status(400).json({ message: 'New password must be at least 12 characters long.' });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (await user.matchPassword(currentPassword)) {
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password updated successfully.' });
    } else {
      res.status(401).json({ message: 'Incorrect current password.' });
    }
  } catch (error) {
    console.error(`[CHANGE PASSWORD ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while changing password.' });
  }
};

/**
 * @desc    Increment the profile view count for a user
 * @route   PUT /api/users/:id/view
 * @access  Private
 */
const recordProfileView = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot view your own profile." });
    }
    const viewedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $inc: { profileViews: 1 } },
      { new: true }
    ).select('-password');
    if (!viewedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(viewedUser);
  } catch (error) {
    console.error(`[RECORD VIEW ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while recording profile view.' });
  }
};

/**
 * @desc    Request a password reset
 * @route   POST /api/users/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
    }
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // --- UPDATED EMAIL CONTENT with HTML ---
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const textMessage = `You have requested a password reset. Please click the link below to set a new password:\n\n${resetUrl}\n\nThis link is valid for 10 minutes.`;
    const htmlMessage = `<p>You have requested a password reset. Please click the link below to set a new password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link is valid for 10 minutes.</p>`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'CoStacked - Password Reset Request',
        text: textMessage,
        html: htmlMessage, // Pass the HTML version
      });
      res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (emailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error(emailError);
      res.status(500).json({ message: 'Error sending email. Please try again.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * @desc    Reset password using token
 * @route   PUT /api/users/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired.' });
    }
    if (req.body.password.length < 12) {
      return res.status(400).json({ message: 'Password must be at least 12 characters long.' });
    }
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * @desc    Cancel a user's verification subscription
 * @route   PUT /api/users/cancel-subscription
 * @access  Private
 */
const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    user.isVerified = false;
    const updatedUser = await user.save();
    res.json({ success: true, message: 'Your subscription has been canceled.', user: updatedUser });
  } catch (error) {
    console.error(`[CANCEL SUBSCRIPTION ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while canceling subscription.' });
  }
};

/**
 * @desc    Upload or update a user's avatar
 * @route   PUT /api/users/profile/avatar
 * @access  Private
 */
const updateUserAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // `req.file` is populated by Multer/Cloudinary with the upload details.
    // We only need the secure URL.
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: 'Image file is required.' });
    }

    user.avatarUrl = req.file.path; // The secure URL from Cloudinary
    const updatedUser = await user.save();

    // Send back the full user object to sync the frontend
    res.json(updatedUser);

  } catch (error) {
    console.error(`[UPDATE AVATAR ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while updating avatar.' });
  }
};

/**
 * @desc    Delete the logged-in user's own account
 * @route   DELETE /api/users/profile
 * @access  Private
 */
const deleteUserAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // You could add more logic here in the future, like deleting associated
    // projects, cleaning up connections, etc.
    
    await User.deleteOne({ _id: req.user._id });

    // On success, we just send a confirmation message. The frontend will handle logout.
    res.json({ success: true, message: 'Your account has been permanently deleted.' });

  } catch (error) {
    console.error(`[DELETE ACCOUNT ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while deleting account.' });
  }
};

module.exports = {
  registerUser,
  authUser,
  getUsers,
  verifyEmail,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  recordProfileView,
  forgotPassword,
  resetPassword,
  cancelSubscription,
  updateUserAvatar,
  deleteUserAccount,
};