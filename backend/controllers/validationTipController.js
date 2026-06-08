const ValidationTip = require('../models/ValidationTip');
const Article = require('../models/Article');
const socketUtil = require('../utils/socket');

exports.getValidationTips = async (req, res) => {
  try {
    const now = new Date();
    let tipsQuery = { isActive: true };

    if (req.query.admin === 'true') {
      if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      tipsQuery = {}; // Admin can view all tips for management
    } else {
      tipsQuery = {
        isActive: true,
        $and: [
          { $or: [{ startAt: null }, { startAt: { $lte: now } }] },
          { $or: [{ endAt: null }, { endAt: { $gte: now } }] },
        ],
      };
    }

    const tips = await ValidationTip.find(tipsQuery).sort({ order: 1 });

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
    const { title, content, order, startAt, endAt, isActive } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }
    const tip = await ValidationTip.create({
      title,
      content,
      order: order || 0,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      startAt: startAt ? new Date(startAt) : null,
      endAt: endAt ? new Date(endAt) : null,
    });
    res.status(201).json(tip);

    try {
      const io = socketUtil.getIo();
      if (io) io.to('validation_tips').emit('validation_tips_updated', { action: 'create', tip });
    } catch (e) { console.error('Socket emit error (validation tip create):', e); }
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
    tip.startAt = req.body.startAt ? new Date(req.body.startAt) : req.body.startAt === '' ? null : tip.startAt;
    tip.endAt = req.body.endAt ? new Date(req.body.endAt) : req.body.endAt === '' ? null : tip.endAt;
    await tip.save();
    res.status(200).json(tip);

    try {
      const io = socketUtil.getIo();
      if (io) io.to('validation_tips').emit('validation_tips_updated', { action: 'update', tip });
    } catch (e) { console.error('Socket emit error (validation tip update):', e); }
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

    try {
      const io = socketUtil.getIo();
      if (io) io.to('validation_tips').emit('validation_tips_updated', { action: 'delete', tipId: req.params.id });
    } catch (e) { console.error('Socket emit error (validation tip delete):', e); }
  } catch (error) {
    console.error('Error deleting validation tip:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
