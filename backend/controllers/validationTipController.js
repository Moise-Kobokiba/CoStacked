const ValidationTip = require('../models/ValidationTip');

exports.getValidationTips = async (req, res) => {
  try {
    const tips = await ValidationTip
      .find({ isActive: true })
      .sort({ order: 1 });

    res.status(200).json(tips);
  } catch (error) {
    console.error('Error fetching validation tips:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
