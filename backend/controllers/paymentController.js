// backend/controllers/paymentController.js
const Project = require('../models/Project');
const User = require('../models/User'); // Corrected casing
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const AdminNotification = require('../models/AdminNotification'); // For admin panel notifications

// Maps for boost durations
const PROFILE_BOOST_DURATIONS = { '3d': 3, '5d': 5, '7d': 7 };
const PROJECT_BOOST_DURATIONS = { '3d': 3, '5d': 5, '7d': 7 };

/**
 * @desc    Verify a Yoco payment for boosting a project
 * @route   POST /api/payments/verify
 * @access  Private
 */
const verifyPaymentAndBoost = async (req, res) => {
  try {
    const { chargeToken, projectId, tierId } = req.body;
    
    if (!chargeToken || !projectId || !tierId) {
      return res.status(400).json({ message: 'Missing required payment or project details.' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    
    const durationDays = PROJECT_BOOST_DURATIONS[tierId];
    if (!durationDays) {
      return res.status(400).json({ message: 'Invalid boost tier selected.' });
    }

    project.isBoosted = true;
    const now = new Date();
    project.boostExpiresAt = new Date(new Date().setDate(now.getDate() + durationDays));
    const updatedProject = await project.save();

    await Transaction.create({
      userId: req.user._id,
      type: 'project_boost',
      amountInCents: 10000, // TODO: Replace with dynamic amount based on tierId
      yocoChargeId: chargeToken,
      status: 'succeeded',
      metadata: { projectId: updatedProject._id, projectTitle: updatedProject.title },
    });

    // Create notification for the user
    await Notification.create({
      recipient: req.user._id,
      type: 'BOOST_SUCCESS',
      projectId: updatedProject._id
    });

    // --- CREATE ADMIN NOTIFICATION ---
    await AdminNotification.create({
      type: 'PAYMENT_SUCCESS',
      message: `${req.user.name} successfully boosted project "${updatedProject.title}".`,
      link: '/transactions',
      refId: updatedProject._id
    });

    res.json({ 
      success: true, 
      message: `Project has been successfully boosted for ${durationDays} days!`,
      project: updatedProject 
    });

  } catch (error) {
    console.error(`[YOCO BOOST VERIFY ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Failed to verify boost payment.' });
  }
};

/**
 * @desc    Verify a Yoco payment for a subscription and update user's verified status
 * @route   POST /api/payments/verify-subscription
 * @access  Private
 */
const verifySubscription = async (req, res) => {
  try {
    const { chargeToken } = req.body;
    const userId = req.user._id;

    if (!chargeToken) {
      return res.status(400).json({ message: 'A charge token is required.' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.isVerified = true;
    user.isSubscriptionAutoRenew = true;
    const now = new Date();
    user.subscriptionExpiresAt = new Date(new Date().setDate(now.getDate() + 30));
    
    const updatedUser = await user.save();

    await Transaction.create({
      userId: updatedUser._id,
      type: 'subscription',
      amountInCents: 20000, // R200
      yocoChargeId: chargeToken,
      status: 'succeeded',
    });

    // Create notification for the user
    await Notification.create({
      recipient: req.user._id,
      type: 'SUBSCRIPTION_SUCCESS'
    });
    
    // --- CREATE ADMIN NOTIFICATION ---
    await AdminNotification.create({
      type: 'PAYMENT_SUCCESS',
      message: `${req.user.name} successfully subscribed for verification.`,
      link: '/transactions',
      refId: req.user._id
    });
    
    res.json({ 
      success: true, 
      message: "Subscription successful! Your account is now verified.",
      user: updatedUser
    });

  } catch (error) {
    console.error(`[YOCO SUBSCRIPTION VERIFY ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Failed to verify subscription payment.' });
  }
};

/**
 * @desc    Verify a Yoco payment for a profile boost and update user's boost status
 * @route   POST /api/payments/verify-profile-boost
 * @access  Private
 */
const verifyProfileBoost = async (req, res) => {
    try {
        const { chargeToken, tierId } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        
        const durationDays = PROFILE_BOOST_DURATIONS[tierId];
        if (!durationDays) {
            return res.status(400).json({ message: "Invalid boost tier provided." });
        }

        user.isBoosted = true;
        const now = new Date();
        user.boostExpiresAt = new Date(new Date().setDate(now.getDate() + durationDays));
        const updatedUser = await user.save();

        await Transaction.create({
          userId: updatedUser._id,
          type: 'profile_boost',
          amountInCents: 10000, // TODO: Replace with dynamic amount based on tierId
          yocoChargeId: chargeToken,
          status: 'succeeded',
        });
        
        // Create notification for the user
        await Notification.create({
          recipient: req.user._id,
          type: 'BOOST_SUCCESS'
        });

        // --- CREATE ADMIN NOTIFICATION ---
        await AdminNotification.create({
          type: 'PAYMENT_SUCCESS',
          message: `${req.user.name} successfully boosted their profile.`,
          link: '/transactions',
          refId: req.user._id
        });
        
        res.json({ success: true, message: `Profile boosted for ${durationDays} days!`, user: updatedUser });
        
    } catch (error) {
        console.error(`[YOCO PROFILE BOOST VERIFY ERROR]: ${error.message}`);
        res.status(500).json({ message: 'Failed to verify profile boost payment.' });
    }
};

/**
 * @desc    Cancel user's subscription auto-renewal
 * @route   POST /api/payments/cancel-subscription
 * @access  Private
 */
const cancelSubscription = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        user.isSubscriptionAutoRenew = false;
        const updatedUser = await user.save();

        res.json({ 
            success: true, 
            message: "Subscription auto-renewal cancelled. Your verified badge will remain until the billing period ends.",
            user: updatedUser
        });

    } catch (error) {
        console.error(`[CANCEL SUBSCRIPTION ERROR]: ${error.message}`);
        res.status(500).json({ message: 'Failed to cancel subscription.' });
    }
};

// Export all controller functions
module.exports = { 
  verifyPaymentAndBoost, 
  verifySubscription,
  verifyProfileBoost,
  cancelSubscription
};