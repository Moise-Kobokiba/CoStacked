// backend/controllers/paymentController.js
const Project = require('../models/Project');
const User = require('../models/User'); // Corrected casing
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const AdminNotification = require('../models/AdminNotification'); // For admin panel notifications
const fetch = require('node-fetch');

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
    const notif = await Notification.create({
      recipient: req.user._id,
      type: 'BOOST_SUCCESS',
      projectId: updatedProject._id
    });
    try {
      const socketUtil = require('../utils/socket');
      const io = socketUtil.getIo();
      if (io) io.to(req.user._id.toString()).emit('notification_created', notif);
    } catch (e) { console.error('Socket emit error (boost success):', e); }

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
    const notifSub = await Notification.create({
      recipient: req.user._id,
      type: 'SUBSCRIPTION_SUCCESS'
    });
    try { const socketUtil = require('../utils/socket'); const io = socketUtil.getIo(); if (io) io.to(req.user._id.toString()).emit('notification_created', notifSub); } catch (e) { console.error('Socket emit error (subscription success):', e); }
    
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

/**
 * @desc    Create a Yoco Checkout Session
 * @route   POST /api/payments/checkout
 * @access  Private
 */
const createCheckoutSession = async (req, res) => {
  try {
    const { amountInCents, currency, metadata } = req.body; // metadata contains: type, userId, etc.

    // Construct the success/cancel URLs
    // Assuming FRONTEND_URL is set, otherwise default to localhost for dev
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // We append metadata to the success URL so the frontend knows what to verify/show
    // In a production app, verify this via webhook or backend query using checkout ID.
    const successUrl = `${frontendUrl}/payment/success?type=${metadata?.type || 'unknown'}&ref=${metadata?.projectId || ''}`;
    const cancelUrl = `${frontendUrl}/payment/cancel`;

    const response = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.YOCO_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency: currency || 'ZAR',
        metadata: {
            ...metadata,
            userId: req.user._id.toString()
        },
        successUrl: successUrl,
        cancelUrl: cancelUrl,
        failUrl: cancelUrl // Yoco might use failUrl
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Yoco Checkout Error:', data);
      return res.status(response.status).json({ message: 'Failed to initiate payment provider.', error: data });
    }

    // Yoco returns { id, redirectUrl, ... }
    res.json({ redirectUrl: data.redirectUrl, checkoutId: data.id });

  } catch (error) {
    console.error(`[YOCO CHECKOUT ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Failed to create checkout session.' });
  }
};

/**
 * @desc    Verify a Yoco Checkout and update user status
 * @route   POST /api/payments/verify-checkout
 * @access  Private
 */
const verifyCheckout = async (req, res) => {
  try {
    const { checkoutId } = req.body;

    if (!checkoutId) {
      return res.status(400).json({ message: 'Checkout ID is required.' });
    }

    // Verify status with Yoco
    const response = await fetch(`https://payments.yoco.com/api/checkouts/${checkoutId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.YOCO_SECRET_KEY}`,
      }
    });

    const checkoutData = await response.json();
    console.log('[VERIFY_CHECKOUT] Yoco Response:', JSON.stringify(checkoutData, null, 2));

    if (!response.ok) {
        console.error('Yoco Verification Error:', checkoutData);
        return res.status(response.status).json({ message: 'Failed to verify payment with provider.' });
    }

    // Check if payment was successful
    // Allow 'succeeded', 'successful', or 'completed' (Yoco seems to return 'completed')
    const status = checkoutData.status?.toLowerCase();
    const validStatuses = ['succeeded', 'successful', 'completed'];
    
    if (!validStatuses.includes(status)) {
        console.warn(`[VERIFY_CHECKOUT] Failed: Status is ${checkoutData.status}`);
        return res.status(400).json({ message: `Payment status is '${checkoutData.status}', expected 'completed' or 'succeeded'.` });
    }

    const { metadata, amount, currency } = checkoutData;
    const userId = req.user._id;

    // Based on metadata type, perform actions
    // Note: In createCheckoutSession, we stored type in metadata
    const type = metadata?.type || 'unknown';

    const user = await User.findById(userId);

    if (type === 'subscription') {
        user.isVerified = true;
        user.isSubscriptionAutoRenew = true;
        
        // simple 30 day logic
        const now = new Date();
        const expiresAt = new Date(now.setDate(now.getDate() + 30));
        user.subscriptionExpiresAt = expiresAt;

        await user.save();

        // Create notification
        await Notification.create({
            recipient: user._id,
            type: 'SUBSCRIPTION_SUCCESS',
            relatedId: checkoutId,
            relatedModel: 'Transaction' 
        });

         // Record Transaction (check for duplicates first)
         const existingTransaction = await Transaction.findOne({ yocoChargeId: checkoutId });
         if (!existingTransaction) {
             await Transaction.create({
                userId: user._id,
                type: 'subscription',
                amountInCents: amount, // amount is in cents from Yoco
                currency: currency,
                yocoChargeId: checkoutId,
                status: 'succeeded'
            });
         }

        res.json({ success: true, message: 'Subscription verified and active.', user });
    } else if (type === 'project_boost') {
        const projectId = metadata.projectId;
        const tierId = metadata.tierId; // '3d', '5d', '7d'

        // Constants matching BoostModal.jsx
        // In a real app, these should be shared or in DB
        const BOOST_DURATIONS = { '3d': 3, '5d': 5, '7d': 7 };
        const durationDays = BOOST_DURATIONS[tierId];

        if (!projectId || !durationDays) {
           return res.status(400).json({ message: "Invalid project or boost tier." });
        }

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: "Project to boost not found." });

        project.isBoosted = true;
        const now = new Date();
        project.boostExpiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
        await project.save();

        // Check if transaction already exists to prevent duplicates
        const existingTransaction = await Transaction.findOne({ yocoChargeId: checkoutId });
        if (!existingTransaction) {
            await Transaction.create({
                userId: userId,
                type: 'project_boost',
                amountInCents: amount,
                currency: currency,
                yocoChargeId: checkoutId,
                status: 'succeeded',
                metadata: { projectId: projectId, projectTitle: project.title }
            });
        }

        res.json({ success: true, message: `Project boosted for ${durationDays} days!`, user });

    } else if (type === 'profile_boost') {
        const tierId = metadata.tierId;
        const BOOST_DURATIONS = { '3d': 3, '5d': 5, '7d': 7 };
        const durationDays = BOOST_DURATIONS[tierId];

        if (!durationDays) {
            return res.status(400).json({ message: "Invalid boost tier provided." });
        }

        user.isBoosted = true;
        const now = new Date();
        user.boostExpiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
        const updatedUser = await user.save();

        // Check if transaction already exists to prevent duplicates
        const existingTransaction = await Transaction.findOne({ yocoChargeId: checkoutId });
        if (!existingTransaction) {
            await Transaction.create({
                userId: userId,
                type: 'profile_boost',
                amountInCents: amount,
                currency: currency,
                yocoChargeId: checkoutId,
                status: 'succeeded'
            });
        }

        // Only create notification if it doesn't already exist
        const existingNotif = await Notification.findOne({ 
            recipient: user._id,
            relatedId: checkoutId 
        });
        
        if (!existingNotif) {
          const n = await Notification.create({
            recipient: user._id,
            type: 'BOOST_SUCCESS',
            relatedId: checkoutId,
            relatedModel: 'Transaction' 
          });
          try { const socketUtil = require('../utils/socket'); const io = socketUtil.getIo(); if (io) io.to(user._id.toString()).emit('notification_created', n); } catch (e) { console.error('Socket emit error (checkout boost):', e); }
        }

        res.json({ success: true, message: `Profile boosted for ${durationDays} days!`, user: updatedUser });

    } else {
        // Fallback
        res.json({ success: true, message: 'Payment verified.', user });
    }

  } catch (error) {
    console.error(`[VERIFY CHECKOUT ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error during verification.' });
  }
};

// Export all controller functions
module.exports = { 
  verifyPaymentAndBoost, 
  verifySubscription,
  verifyProfileBoost,
  cancelSubscription,
  createCheckoutSession,
  verifyCheckout
};