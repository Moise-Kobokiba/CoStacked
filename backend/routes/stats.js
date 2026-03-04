// routes/stats.js
router.get('/community', async (req, res) => {
  try {
    const totalIdeas = await Idea.countDocuments();
    const totalValidations = await Idea.aggregate([
      { $group: { _id: null, total: { $sum: "$engagementCount" } } }
    ]);

    const activeFounders = await User.countDocuments({
      lastActiveAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) }
    });

    res.json({
      totalIdeas,
      totalValidations: totalValidations[0]?.total || 0,
      activeFounders,
      growthPercentage: 68 // calculate this properly later
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
