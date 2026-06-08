// backend/controllers/reviewController.js

const Review = require('../models/Review');
const Interest = require('../models/Interest');
const Project = require('../models/Project');
const Notification = require('../models/Notification'); // <-- IMPORT

/**
 * @desc    Create a new review for a developer
 * @route   POST /api/reviews
 * @access  Private (Founders only)
 */
const createReview = async (req, res) => {
  try {
    const { rating, comment, developerId, projectId } = req.body;
    const founderId = req.user._id;

    if (req.user.role !== 'founder') {
      return res.status(403).json({ message: 'Only founders can leave reviews.' });
    }

    // Enforce that a written comment is required for endorsements/reviews
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required for a review/endorsement.' });
    }

    const connectionExists = await Interest.findOne({
      projectId,
      senderId: developerId,
      receiverId: founderId,
      status: 'approved',
    });

    if (!connectionExists) {
      return res.status(403).json({ message: 'You can only review developers you have an approved connection with.' });
    }
    
    const reviewExists = await Review.findOne({ founderId, developerId, projectId });
    if (reviewExists) {
        return res.status(400).json({ message: 'You have already reviewed this developer for this project.' });
    }

    const review = await Review.create({
      rating,
      comment,
      founderId,
      developerId,
      projectId
    });

    const populatedReview = await Review.findById(review._id)
      .populate('founderId', 'name avatarUrl')
      .populate('projectId', 'title');

    // --- CREATE NOTIFICATION ---
    // The developer receives a notification that they have a new review.
    await Notification.create({
      recipient: developerId,
      sender: founderId,
      type: 'NEW_REVIEW',
      projectId: projectId
    });

    res.status(201).json(populatedReview);

  } catch (error) {
    console.error(`[CREATE REVIEW ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while creating review.' });
  }
};

/**
 * @desc    Get all reviews for a specific developer
 * @route   GET /api/reviews/user/:id
 * @access  Public
 */
const getReviewsForUser = async (req, res) => {
  try {
    const reviews = await Review.find({ developerId: req.params.id })
      .populate('founderId', 'name avatarUrl')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 });
      
    res.json(reviews);
  } catch (error) {
    console.error(`[GET REVIEWS ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while fetching reviews.' });
  }
};

module.exports = { createReview, getReviewsForUser };