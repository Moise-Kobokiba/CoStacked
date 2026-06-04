const ValidationTip = require('../models/ValidationTip');
const Article = require('../models/Article');

exports.getValidationTips = async (req, res) => {
  try {
    const tips = await ValidationTip.find({ isActive: true }).sort({ order: 1 });

    const articleTips = await Article.find({
      isPublished: true,
      $or: [
        { category: { $regex: 'validation', $options: 'i' } },
        { description: { $regex: 'validation', $options: 'i' } },
        { title: { $regex: 'validation', $options: 'i' } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(4)
      .select('title description slug');

    const mirroredTips = articleTips.map((article, index) => ({
      _id: `article-${article._id}`,
      title: article.title,
      content: article.description || article.title,
      sourceUrl: `/info-hub/${article.slug}`,
      sourceType: 'article',
      order: index + 1,
    }));

    res.status(200).json({
      manualTips: tips,
      articleTips: mirroredTips,
    });
  } catch (error) {
    console.error('Error fetching validation tips:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createValidationTip = async (req, res) => {
  try {
    const { title, content, order } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }
    const tip = await ValidationTip.create({ title, content, order: order || 0, isActive: true });
    res.status(201).json(tip);
  } catch (error) {
    console.error('Error creating validation tip:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateValidationTip = async (req, res) => {
  try {
    const tip = await ValidationTip.findById(req.params.id);
    if (!tip) {
      return res.status(404).json({ message: 'Tip not found' });
    }
    tip.title = req.body.title ?? tip.title;
    tip.content = req.body.content ?? tip.content;
    tip.order = req.body.order ?? tip.order;
    tip.isActive = req.body.isActive ?? tip.isActive;
    await tip.save();
    res.status(200).json(tip);
  } catch (error) {
    console.error('Error updating validation tip:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteValidationTip = async (req, res) => {
  try {
    const tip = await ValidationTip.findById(req.params.id);
    if (!tip) {
      return res.status(404).json({ message: 'Tip not found' });
    }
    await tip.deleteOne();
    res.status(200).json({ message: 'Validation tip deleted' });
  } catch (error) {
    console.error('Error deleting validation tip:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
