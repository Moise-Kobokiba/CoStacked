// backend/controllers/userController.js

const User = require('../models/User');
const AdminNotification = require('../models/AdminNotification');
const TempRegistration = require('../models/TempRegistration');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Connection = require('../models/Connection');
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
    let { name, email, password: rawPassword, role, bio, skills, location, availability, portfolioLink, socials } = req.body;
    email = email.toLowerCase(); // Normalize email to lowercase
    const password = rawPassword.trim();

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
      socials: socials || {},
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
        let { email, token } = req.body;
        if (email) email = email.toLowerCase();
        console.log('verifyEmail - Received request:', { email, token: token ? 'present' : 'missing' });

        if (!email || !token) {
            return res.status(400).json({ message: 'Email and token are required.' });
        }

        // First, check for temporary registration (regular users)
        console.log('verifyEmail - Looking for temp registration...');
        const tempRegistration = await TempRegistration.findOne({
            email,
            verificationToken: token,
            expiresAt: { $gt: Date.now() }
        });

        console.log('verifyEmail - Temp registration found:', !!tempRegistration);

        if (tempRegistration) {
            console.log('verifyEmail - Creating user account...');
            console.log('verifyEmail - Temp registration data:', {
                name: tempRegistration.name,
                email: tempRegistration.email,
                role: tempRegistration.role,
                isAdmin: tempRegistration.isAdmin,
                hasPassword: !!tempRegistration.password
            });

            // Check if user already exists
            const existingUser = await User.findOne({ email: tempRegistration.email });
            if (existingUser) {
                console.log('verifyEmail - User already exists, cleaning up temp registration');
                await TempRegistration.deleteOne({ _id: tempRegistration._id });
                return res.status(400).json({ message: 'Account already verified. Please log in instead.' });
            }

            // Validate required fields
            if (!tempRegistration.password || tempRegistration.password.trim() === '') {
                console.error('verifyEmail - Password is empty or invalid');
                return res.status(400).json({ message: 'Invalid registration data. Password is required.' });
            }

            // Handle regular user verification
            // Create the actual user account
            const user = new User({
                name: tempRegistration.name,
                email: tempRegistration.email,
                password: tempRegistration.password, // Password is already hashed and trimmed from registration
                role: tempRegistration.role,
                bio: tempRegistration.bio || '',
                skills: tempRegistration.skills || [],
                location: tempRegistration.location || '',
                availability: tempRegistration.availability || '',
                portfolioLink: tempRegistration.portfolioLink || '',
                socials: tempRegistration.socials || {},
                isAdmin: tempRegistration.isAdmin || false, // Set admin flag if this was an admin registration
                isEmailVerified: true
            });

            // Mark password as not modified to prevent double hashing
            user.markModified('password', false);

            console.log('verifyEmail - Creating user with data:', {
                name: user.name,
                email: user.email,
                role: user.role,
                isAdmin: user.isAdmin,
                isEmailVerified: user.isEmailVerified,
                password: '[ALREADY_HASHED]'
            });

            await user.save();
            console.log('verifyEmail - User created successfully:', user._id);

            // Create admin notification
            try {
                if (user.isAdmin) {
                    await AdminNotification.create({
                        type: 'NEW_ADMIN_REGISTERED',
                        message: `New admin ${user.name} has joined the platform.`,
                        link: `/admin/users`,
                        refId: user._id
                    });
                    console.log('verifyEmail - Admin notification created');
                } else {
                    await AdminNotification.create({
                        type: 'NEW_USER_REGISTERED',
                        message: `${user.name} has just signed up as a ${user.role}.`,
                        link: `/users`,
                        refId: user._id
                    });
                    console.log('verifyEmail - User notification created');
                }
            } catch (notificationError) {
                console.error('verifyEmail - Error creating notification:', notificationError);
                // Don't fail the whole process for notification errors
            }

            // Remove the temporary registration record
            await TempRegistration.deleteOne({ _id: tempRegistration._id });
            console.log('verifyEmail - Temp registration cleaned up');

            // Generate JWT token for auto-login
            const token = generateToken(user._id);

            return res.json({
                success: true,
                message: 'Email verified successfully! Your account has been created and you are now logged in.',
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isAdmin: user.isAdmin
                },
                token
            });
        }

        // If no temp registration found, token is invalid
        // Note: Admin users now also use TempRegistration (same as regular users)
        return res.status(400).json({ message: 'Invalid or expired verification token.' });

    } catch (error) {
        console.error(`[VERIFY EMAIL ERROR]: ${error.message}`);
        console.error('Error stack:', error.stack);
        console.error('Error details:', error);
        res.status(500).json({
            message: 'Server error during email verification.',
            error: error.message
        });
    }
};


/**
 * @desc    Authenticate (log in) a user & get a JWT
 * @route   POST /api/users/login
 * @access  Public
 */
const authUser = async (req, res) => {
  try {
    let { email, password: rawPassword } = req.body;
    if (email) email = email.toLowerCase();
    const password = rawPassword.trim();
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    console.log(`[AUTH ATTEMPT]: Email: ${email}, Password provided: ${!!rawPassword}, Trimmed length: ${password.length}`);

const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    if (!user.password) {
      return res.status(401).json({ message: 'Account uses OAuth login. Please log in with the linked provider or set a password.' });
    }
    if (user && (await user.matchPassword(password))) {
      if (!user.isEmailVerified) {
        return res.status(401).json({
          message: 'Email not verified. Please check your inbox for a verification code.',
          emailNotVerified: true
        });
      }

      // Update last active timestamp on login
      user.lastActiveAt = new Date();
      await user.save();

      // Generate JWT token
      const token = generateToken(user._id);

      res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin,
          isOnline: user.isOnline,
          lastActiveAt: user.lastActiveAt,
        },
        token
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password.' });
    }


  } catch (error) {
    console.error(`[AUTH ERROR]: ${error.message}`);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error during authentication.' });
  }
};

/**
 * @desc    Get all users for the public browse page (excludes admin users)
 * @route   GET /api/users
 * @access  Public
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ isAdmin: { $ne: true } }).select('-password').sort({ createdAt: -1 });
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
      user.headline = req.body.headline ?? user.headline;
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
      // --- NEW: Update socials object ---
      // This ensures we can update one link at a time without erasing the others.
      if (req.body.socials) {
        user.socials = { ...user.socials, ...req.body.socials };
      }

      // --- NEW: Handle Career & Educational History ---
      if (req.body.experience) {
        user.experience = req.body.experience;
      }
      if (req.body.education) {
        user.education = req.body.education;
      }

      // --- NEW: Handle Categorized Skills ---
      if (req.body.softSkills) {
        user.softSkills = Array.isArray(req.body.softSkills) ? req.body.softSkills : [];
      }
      if (req.body.startupSkills) {
        user.startupSkills = Array.isArray(req.body.startupSkills) ? req.body.startupSkills : [];
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
    const { currentPassword: rawCurrent, newPassword: rawNew } = req.body;
    const currentPassword = rawCurrent.trim();
    const newPassword = rawNew.trim();
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
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: "You cannot view your own profile." });
    }

    const viewedUser = await User.findById(targetUserId);
    if (!viewedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // --- NEW: 12-hour Cool-down Logic ---
    // Check if this user has viewed this profile in the last 12 hours
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const recentView = viewedUser.viewHistory.find(
      (view) => 
        view.viewerId && 
        view.viewerId.toString() === currentUserId.toString() && 
        view.viewedAt > twelveHoursAgo
    );

    if (!recentView) {
      // Add record to viewHistory and increment total count
      viewedUser.viewHistory.push({ viewerId: currentUserId });
      viewedUser.profileViews = (viewedUser.profileViews || 0) + 1;
      await viewedUser.save();
    }

    res.json({ success: true, profileViews: viewedUser.profileViews });
  } catch (error) {
    console.error(`[RECORD VIEW ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while recording profile view.' });
  }
};

/**
 * @desc    Get the profile view history for the logged-in user
 * @route   GET /api/users/profile/views
 * @access  Private
 */
const getProfileViews = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'viewHistory.viewerId',
        select: 'name avatarUrl role headline'
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Sort history by date (most recent first)
    let history = [...user.viewHistory].sort((a, b) => b.viewedAt - a.viewedAt);

    // Subscription Check
    const isSubscribed = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date();
    
    let isRestricted = false;
    if (!isSubscribed) {
      if (history.length > 6) {
        isRestricted = true;
        history = history.slice(0, 6);
      }
    }

    res.json({
      totalViews: user.profileViews,
      history,
      isRestricted,
      isSubscribed
    });
  } catch (error) {
    console.error(`[GET VIEW HISTORY ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while fetching view history.' });
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
    const password = req.body.password.trim();
    if (password.length < 12) {
      return res.status(400).json({ message: 'Password must be at least 12 characters long.' });
    }
    user.password = password;
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

/**
 * @desc    Complete OAuth user profile (onboarding)
 * @route   PUT /api/users/complete-profile
 * @access  Private
 */
const completeProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update all profile fields from onboarding
    if (req.body.role) user.role = req.body.role;
    if (req.body.headline !== undefined) user.headline = req.body.headline;
    if (req.body.bio !== undefined) user.bio = req.body.bio;
    if (req.body.location !== undefined) user.location = req.body.location;
    if (req.body.availability !== undefined) user.availability = req.body.availability;
    if (req.body.portfolioLink !== undefined) user.portfolioLink = req.body.portfolioLink;
    if (req.body.phoneNumber !== undefined) user.phoneNumber = req.body.phoneNumber;
    if (typeof req.body.skills === 'string') {
      user.skills = req.body.skills.split(',').map(skill => skill.trim()).filter(Boolean);
    }
    if (req.body.socials) {
      user.socials = { ...user.socials, ...req.body.socials };
    }
    
    // --- NEW: Add and Update Career & Educational History ---
    if (req.body.experience) {
      user.experience = req.body.experience;
    }
    if (req.body.education) {
      user.education = req.body.education;
    }
    
    // Mark profile as completed
    user.profileCompleted = true;

    const updatedUser = await user.save();
    res.json({
      success: true,
      message: 'Profile completed successfully!',
      user: updatedUser
    });
  } catch (error) {
    console.error(`[COMPLETE PROFILE ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server Error: Could not complete profile.' });
  }
};

/**
 * @desc    Resend verification email
 * @route   POST /api/users/resend-verification
 * @access  Public
 */
const resendVerificationEmail = async (req, res) => {
  try {
    let { email } = req.body;
    if (email) email = email.toLowerCase();
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(400).json({ message: 'This email is already verified. Please log in.' });
      }
      // User exists but not verified - they should use the verify endpoint
      return res.status(400).json({ message: 'Account exists but is not verified. Please check your email or request a new verification code.' });
    }

    // Find temporary registration
    const tempRegistration = await TempRegistration.findOne({ email });
    if (!tempRegistration) {
      return res.status(404).json({ message: 'No pending registration found for this email. Please sign up again.' });
    }

    // Generate new verification token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update temp registration with new token and reset expiration
    tempRegistration.verificationToken = verificationToken;
    tempRegistration.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await tempRegistration.save();

    // Send new verification email
    const textMessage = `Welcome to CoStacked! Your new verification code is: ${verificationToken}\n\nThis code will expire in 10 minutes.`;
    const htmlMessage = `<p>Welcome to CoStacked! Your new verification code is: <strong>${verificationToken}</strong></p><p>This code will expire in 10 minutes.</p>`;

    try {
      await sendEmail({
        to: email,
        subject: 'CoStacked - New Verification Code',
        text: textMessage,
        html: htmlMessage,
      });

      res.json({
        success: true,
        message: 'New verification code sent! Please check your email.'
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }
  } catch (error) {
    console.error(`[RESEND VERIFICATION ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while resending verification email.' });
  }
};

/**
 * @desc    Toggle a bookmark (Save) on an item
 * @route   PUT /api/users/profile/bookmarks
 * @access  Private
 */
const toggleBookmark = async (req, res) => {
  try {
    const { itemId, itemType } = req.body;
    
    if (!itemId || !itemType) {
      return res.status(400).json({ message: 'itemId and itemType are required' });
    }

    const validTypes = ['post', 'showcase', 'collabThread'];
    if (!validTypes.includes(itemType)) {
      return res.status(400).json({ message: 'Invalid itemType' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const bookmarkIndex = user.bookmarks.findIndex(
      (b) => b.itemId.toString() === itemId.toString() && b.itemType === itemType
    );

    if (bookmarkIndex > -1) {
      // Remove bookmark
      user.bookmarks.splice(bookmarkIndex, 1);
    } else {
      // Add bookmark
      user.bookmarks.push({ itemId, itemType });
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    console.error(`[TOGGLE BOOKMARK ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server Error: Could not toggle bookmark.' });
  }
};

/**
 * @desc    Calculate the response rate for a given user profile (public)
 * @route   GET /api/users/:id/response-rate
 * @access  Public
 */
const getResponseRate = async (req, res) => {
  try {
    const targetUserId = req.params.id;

    // --- 1. Message Reply Rate ---
    // Find all conversations this user is in
    const conversations = await Conversation.find({ participants: targetUserId });

    let conversationsReceivedMessage = 0;
    let conversationsReplied = 0;

    for (const conv of conversations) {
      // Find the first message in this conv NOT sent by the target user
      const firstIncoming = await Message.findOne({
        conversationId: conv._id,
        sender: { $ne: targetUserId }
      }).sort({ createdAt: 1 });

      if (!firstIncoming) continue; // No one messaged them in this conv
      conversationsReceivedMessage++;

      // Check if the target user replied at any point after that first message
      const reply = await Message.findOne({
        conversationId: conv._id,
        sender: targetUserId,
        createdAt: { $gt: firstIncoming.createdAt }
      });

      if (reply) conversationsReplied++;
    }

    // --- 2. Connection Accept Rate ---
    const totalConnectionRequests = await Connection.countDocuments({ recipient: targetUserId });
    const acceptedConnections = await Connection.countDocuments({ recipient: targetUserId, status: 'accepted' });

    // --- 3. Combine ---
    const totalDataPoints = conversationsReceivedMessage + totalConnectionRequests;

    // Not enough data to compute a meaningful rate
    if (totalDataPoints < 3) {
      return res.json({ rate: null, label: 'New', totalDataPoints });
    }

    const messageRate = conversationsReceivedMessage > 0
      ? (conversationsReplied / conversationsReceivedMessage) * 100
      : 100; // If never messaged, don't penalise

    const connectionRate = totalConnectionRequests > 0
      ? (acceptedConnections / totalConnectionRequests) * 100
      : 100;

    const combinedRate = Math.round((messageRate + connectionRate) / 2);

    let label = 'Low';
    if (combinedRate >= 80) label = 'High';
    else if (combinedRate >= 50) label = 'Medium';

    res.json({ rate: combinedRate, label, totalDataPoints });
  } catch (error) {
    console.error(`[GET RESPONSE RATE ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while computing response rate.' });
  }
};

/**
 * @desc    Endorse a user (toggle endorsement)
 * @route   POST /api/users/:id/endorse
 * @access  Private
 */
const endorseUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: 'You cannot endorse yourself.' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const alreadyEndorsed = targetUser.endorsedBy.some(
      (id) => id.toString() === currentUserId.toString()
    );

    if (alreadyEndorsed) {
      // Remove endorsement
      targetUser.endorsedBy = targetUser.endorsedBy.filter(
        (id) => id.toString() !== currentUserId.toString()
      );
      targetUser.endorsementCount = Math.max(0, targetUser.endorsementCount - 1);
    } else {
      // Add endorsement
      targetUser.endorsedBy.push(currentUserId);
      targetUser.endorsementCount = (targetUser.endorsementCount || 0) + 1;
    }

    await targetUser.save();

    res.json({
      endorsed: !alreadyEndorsed,
      endorsementCount: targetUser.endorsementCount,
    });
  } catch (error) {
    console.error(`[ENDORSE USER ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while endorsing user.' });
  }
};

module.exports = {
  registerUser,
  authUser,
  getUsers,
  verifyEmail,
  resendVerificationEmail,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  recordProfileView,
  forgotPassword,
  resetPassword,
  cancelSubscription,
  updateUserAvatar,
  deleteUserAccount,
  completeProfile,
  toggleBookmark,
  getProfileViews,
  getResponseRate,
  endorseUser,
};
