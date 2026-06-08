const express = require('express');
const router = express.Router();
const Idea = require('../models/Idea');
const User = require('../models/User');
const Project = require('../models/Project');
const StackPost = require('../models/StackPost');
const Showcase = require('../models/Showcase');

// routes/stats.js
router.get('/community', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalIdeas = await Idea.countDocuments();
    const activeIdeas = await Idea.countDocuments({ status: 'active' });
    const validatedIdeasCount = await Idea.countDocuments({ validationScore: { $gte: 100 } });
    const totalValidations = await Idea.aggregate([
      { $group: { _id: null, total: { $sum: '$engagementCount' } } }
    ]);
    const totalProjects = await Project.countDocuments();
    const totalPosts = await StackPost.countDocuments();
    const totalShowcases = await Showcase.countDocuments();

    const activeFounders = await User.countDocuments({
      lastActiveAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) }
    });

    res.json({
      totalUsers,
      totalIdeas,
      activeIdeas,
      validatedIdeasCount,
      totalValidations: totalValidations[0]?.total || 0,
      totalProjects,
      totalPosts,
      totalShowcases,
      activeFounders,
      growthPercentage: 68
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;