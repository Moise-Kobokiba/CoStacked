// backend/controllers/adminController.js

const User = require("../models/User"); // Correct casing to match filename
const Project = require("../models/Project");
const Report = require("../models/Report");
const Transaction = require("../models/Transaction");
const AdminNotification = require("../models/AdminNotification");
const sendEmail = require('../utils/sendEmail');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * @desc    Get platform-wide statistics for the admin dashboard
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProjects = await Project.countDocuments();
    const openReportsCount = await Report.countDocuments({ status: 'open' });
    const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));
    const newUsersLast7Days = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    // --- THIS IS THE NEW, SIMPLIFIED REVENUE LOGIC ---
    const revenueData = await Transaction.aggregate([
      {
        $match: { status: 'succeeded' } // Match ALL successful transactions
      },
      {
        $group: {
          _id: null, // Group all of them together
          totalRevenue: { $sum: '$amountInCents' } // Sum their amounts
        }
      }
    ]);
    
    // Process the result
    const totalRevenue = revenueData[0] ? revenueData[0].totalRevenue / 100 : 0;
    // --- END NEW LOGIC ---

    res.json({
      totalUsers,
      totalProjects,
      newUsersLast7Days,
      openReportsCount,
      // Send a single revenue number
      revenue: { allTime: totalRevenue } 
    });

  } catch (error) {
    console.error(`[GET STATS ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while fetching platform stats.' });
  }
};

/**
 * @desc    Authenticate admin & get token
 * @route   POST /api/admin/login
 * @access  Public
 */
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Access Denied. User is not an administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = {
      id: user.id,
      name: user.name,
      isAdmin: user.isAdmin,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      token,
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * @desc    Register a new ADMIN user and send verification email
 * @route   POST /api/admin/register
 * @access  Public (but requires secret key)
 */
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, role, secretKey } = req.body;

    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
        return res.status(401).json({ message: 'Invalid secret key. Not authorized.' });
    }
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'An admin with this email already exists.' });
    }
    
    // --- 2. THIS IS THE NEW, CORRECT LOGIC ---
    // Create the user. isEmailVerified will be false by default.
    const user = await User.create({
      name, email, password, role,
      isAdmin: true,
    });

    if (user) {
      // Generate and save the verification token
      const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
      await User.findByIdAndUpdate(user._id, {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
      });

      // Prepare email content
      const textMessage = `Welcome to the CoStacked Admin team!\n\nYour verification code is: ${verificationToken}\n\nThis code will expire in 10 minutes.`;
      const htmlMessage = `<p>Welcome to the CoStacked Admin team! Your verification code is: <strong>${verificationToken}</strong></p><p>This code will expire in 10 minutes.</p>`;

      try {
        // Send the verification email using the AhaSend utility
        await sendEmail({
          to: user.email,
          subject: 'CoStacked Admin - Verify Your Email',
          text: textMessage,
          html: htmlMessage,
        });

        res.status(201).json({ 
            success: true, 
            message: 'Admin user registered! Please check your email for a verification code.' 
        });
      } catch (emailError) {
        console.error('Admin Email Sending Error:', emailError);
        return res.status(500).json({ message: 'Admin registered, but could not send verification email.' });
      }
    } else {
      res.status(400).json({ message: 'Invalid admin data provided.' });
    }
  } catch (error) {
    console.error(`[REGISTER ADMIN ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error during admin registration.' });
  }
};


/**
 * @desc    Get all users for the admin panel's user management table
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getUsersForAdmin = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(`[GET ADMIN USERS ERROR]: ${error.message}`);
    res.status(500).json({ message: "Server error while fetching users." });
  }
};

/**
 * @desc    Update a user's details by their ID (as an Admin)
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
const updateUserByAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.name = req.body.name || user.name;
    user.role = req.body.role || user.role;
    user.isAdmin = req.body.isAdmin ?? user.isAdmin;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isAdmin: updatedUser.isAdmin,
      createdAt: updatedUser.createdAt,
      bio: updatedUser.bio,
      skills: updatedUser.skills,
      availability: updatedUser.availability,
      location: updatedUser.location,
    });
  } catch (error) {
    console.error(`[ADMIN UPDATE USER ERROR]: ${error.message}`);
    res.status(500).json({ message: "Server error while updating user." });
  }
};

/**
 * @desc    Delete a user by their ID (as an Admin)
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
const deleteUserByAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (req.user._id.toString() === user._id.toString()) {
      return res
        .status(400)
        .json({
          message: "Admins cannot delete their own account from this panel.",
        });
    }

    await User.deleteOne({ _id: req.params.id });
    res.json({ message: "User removed successfully." });
  } catch (error) {
    console.error(`[DELETE USER ERROR]: ${error.message}`);
    res.status(500).json({ message: "Server error while deleting user." });
  }
};

/**
 * @desc    Get all projects for the admin panel
 * @route   GET /api/admin/projects
 * @access  Private/Admin
 */
const getProjectsForAdmin = async (req, res) => {
  try {
    const projects = await Project.find({})
      .populate("founderId", "name email")
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error(`[GET ADMIN PROJECTS ERROR]: ${error.message}`);
    res.status(500).json({ message: "Server error while fetching projects." });
  }
};

/**
 * @desc    Update a project by ID (as Admin)
 * @route   PUT /api/admin/projects/:id
 * @access  Private/Admin
 */
const updateProjectByAdmin = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    project.title = req.body.title || project.title;
    project.description = req.body.description || project.description;
    project.isFeatured = req.body.isFeatured ?? project.isFeatured;

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (error) {
    console.error(`[ADMIN UPDATE PROJECT ERROR]: ${error.message}`);
    res.status(500).json({ message: "Server error while updating project." });
  }
};

/**
 * @desc    Delete a project by ID (as Admin) for moderation
 * @route   DELETE /api/admin/projects/:id
 * @access  Private/Admin
 */
const deleteProjectByAdmin = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await Project.deleteOne({ _id: req.params.id });
    res.json({ message: "Project removed successfully." });
  } catch (error) {
    console.error(`[ADMIN DELETE PROJECT ERROR]: ${error.message}`);
    res.status(500).json({ message: "Server error while deleting project." });
  }
};

/**
 * @desc    Get all open content reports for moderation
 * @route   GET /api/admin/reports
 * @access  Private/Admin
 */
const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: "open" })
      .populate("reporter", "name email")
      .populate("reportedUser", "name email")
      .populate("reportedProject", "title")
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error(`[GET REPORTS ERROR]: ${error.message}`);
    res.status(500).json({ message: "Server error while fetching reports." });
  }
};

/**
 * @desc    Get all transactions for the admin panel
 * @route   GET /api/admin/transactions
 * @access  Private/Admin
 */
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({})
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error(`[GET TRANSACTIONS ERROR]: ${error.message}`);
    res
      .status(500)
      .json({ message: "Server error while fetching transactions." });
  }
};

/**
 * @desc    Get all unread notifications for admins
 * @route   GET /api/admin/notifications
 * @access  Private/Admin
 */
const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await AdminNotification.find({ isRead: false }).sort({
      createdAt: -1,
    });
    res.json(notifications);
  } catch (error) {
    console.error(`[GET ADMIN NOTIFICATIONS ERROR]: ${error.message}`);
    res
      .status(500)
      .json({ message: "Server error fetching admin notifications." });
  }
};

/**
 * @desc    Mark admin notifications as read
 * @route   PUT /api/admin/notifications/mark-read
 * @access  Private/Admin
 */
const markAdminNotificationsAsRead = async (req, res) => {
  try {
    await AdminNotification.updateMany(
      { isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true, message: "Notifications marked as read." });
  } catch (error) {
    console.error(`[MARK ADMIN NOTIFICATIONS READ ERROR]: ${error.message}`);
    res
      .status(500)
      .json({ message: "Server error updating admin notifications." });
  }
};

/**
 * @desc    Update a report's status (resolve/dismiss)
 * @route   PUT /api/admin/reports/:id
 * @access  Private/Admin
 */
const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["resolved", "dismissed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status provided." });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    report.status = status;
    const updatedReport = await report.save();

    res.json(updatedReport);
  } catch (error) {
    console.error(`[UPDATE REPORT ERROR]: ${error.message}`);
    res.status(500).json({ message: "Server error while updating report." });
  }
};

/**
 * @desc    Get the logged-in admin's profile data
 * @route   GET /api/admin/profile
 * @access  Private/Admin
 */
const getAdminProfile = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id).select("-password");

    if (adminUser) {
      res.json(adminUser);
    } else {
      res.status(404).json({ message: "Admin user not found" });
    }
  } catch (error) {
    console.error("Get Admin Profile Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * @desc    Request a password reset for admin users
 * @route   POST /api/admin/forgot-password
 * @access  Public
 */
const forgotAdminPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || !user.isAdmin) {
      return res.json({ success: true, message: 'If an admin account with that email exists, a password reset link has been sent.' });
    }
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // --- UPDATED EMAIL CONTENT with HTML ---
    const baseUrl = process.env.ADMIN_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

    console.log('Forgot password attempt:', {
      email: user.email,
      resetToken: resetToken.substring(0, 10) + '...', // Log partial token for debugging
      resetUrl,
      baseUrl,
    });

    const textMessage = `You have requested a password reset for your admin account. Please click the link below to set a new password:\n\n${resetUrl}\n\nThis link is valid for 10 minutes.`;
    const htmlMessage = `<p>You have requested a password reset for your admin account. Please click the link below to set a new password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link will expire in 10 minutes.</p>`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'CoStacked Admin - Password Reset Request',
        text: textMessage,
        html: htmlMessage,
      });
      console.log('Admin forgot password email sent successfully to:', user.email);
      res.json({ success: true, message: 'If an admin account with that email exists, a password reset link has been sent.' });
    } catch (emailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Failed to send admin forgot password email:', emailError);
      res.status(500).json({ message: 'Error sending email. Please try again.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  loginAdmin,
  getPlatformStats,
  registerAdmin,
  getUsersForAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
  getProjectsForAdmin,
  updateProjectByAdmin,
  deleteProjectByAdmin,
  getReports,
  getTransactions,
  getAdminNotifications,
  markAdminNotificationsAsRead,
  updateReportStatus,
  getAdminProfile,
  forgotAdminPassword,
};
