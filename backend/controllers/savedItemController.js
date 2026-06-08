// backend/controllers/savedItemController.js

const SavedItem = require('../models/SavedItem');
const Project = require('../models/Project');
const Idea = require('../models/Idea');
const StackPost = require('../models/StackPost');
const Showcase = require('../models/Showcase');
const CollabThread = require('../models/CollabThread');
const User = require('../models/User');
const socketUtil = require('../utils/socket');

const MODEL_MAP = {
  project: { model: Project, refModel: 'Project', populate: 'founderId name avatarUrl headline' },
  idea: { model: Idea, refModel: 'Idea', populate: 'founder name avatarUrl headline' },
  stackpost: { model: StackPost, refModel: 'StackPost', populate: 'author name avatarUrl' },
  showcase: { model: Showcase, refModel: 'Showcase', populate: 'creator name avatarUrl' },
  collab: { model: CollabThread, refModel: 'CollabThread', populate: 'creator name avatarUrl' },
  talent: { model: User, refModel: 'User', populate: '' },
};

/**
 * @desc    Get all saved items for current user
 * @route   GET /api/saved-items
 * @access  Private
 */
const getSavedItems = async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = { user: req.user._id };

    if (type && type !== 'all') {
      query.itemType = type;
    }

    let savedItems = await SavedItem.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Populate each saved item with its referenced document
    const populatedItems = await Promise.all(
      savedItems.map(async (item) => {
        try {
          const mapping = MODEL_MAP[item.itemType];
          if (!mapping) return { ...item, itemData: null };

          const doc = await mapping.model
            .findById(item.itemId)
            .populate(mapping.populate)
            .lean();

          return { ...item, itemData: doc };
        } catch (err) {
          return { ...item, itemData: null };
        }
      })
    );

    // Filter out items whose referenced document was deleted
    const validItems = populatedItems.filter((item) => item.itemData !== null);

    // Apply search filter if provided
    let filtered = validItems;
    if (search) {
      const q = search.toLowerCase();
      filtered = validItems.filter((item) => {
        const data = item.itemData;
        if (!data) return false;
        const searchable = `${data.title || ''} ${data.name || ''} ${data.description || ''} ${data.problemStatement || ''} ${data.body || ''}`.toLowerCase();
        return searchable.includes(q);
      });
    }

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching saved items:', error);
    res.status(500).json({ message: 'Server error fetching saved items.' });
  }
};

/**
 * @desc    Save an item
 * @route   POST /api/saved-items
 * @access  Private
 */
const saveItem = async (req, res) => {
  try {
    const { itemType, itemId } = req.body;

    if (!itemType || !itemId) {
      return res.status(400).json({ message: 'itemType and itemId are required' });
    }

    const mapping = MODEL_MAP[itemType];
    if (!mapping) {
      return res.status(400).json({ message: 'Invalid itemType' });
    }

    // Verify the referenced document exists
    const doc = await mapping.model.findById(itemId);
    if (!doc) {
      return res.status(404).json({ message: 'Referenced item not found' });
    }

    // Check if already saved
    const existing = await SavedItem.findOne({
      user: req.user._id,
      itemType,
      itemId,
    });

    if (existing) {
      return res.status(400).json({ message: 'Item already saved' });
    }

    const savedItem = await SavedItem.create({
      user: req.user._id,
      itemType,
      itemId,
      itemRefModel: mapping.refModel,
    });

    // Emit socket event so clients can refresh saved items in real-time
    try {
      const io = socketUtil.getIo();
      if (io) {
        io.to(req.user._id.toString()).emit('saved_items_updated', {
          userId: req.user._id,
          action: 'saved',
          savedItem: savedItem,
          itemType,
          itemId,
        });
      }
    } catch (e) {
      console.error('Failed to emit saved_items_updated socket event:', e);
    }

    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error saving item:', error);
    res.status(500).json({ message: 'Server error saving item.' });
  }
};

/**
 * @desc    Unsave an item
 * @route   DELETE /api/saved-items/:id
 * @access  Private
 */
const unsaveItem = async (req, res) => {
  try {
    const savedItem = await SavedItem.findById(req.params.id);

    if (!savedItem) {
      return res.status(404).json({ message: 'Saved item not found' });
    }

    if (savedItem.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to unsave this item' });
    }

    await savedItem.deleteOne();

    // Emit socket event to notify clients
    try {
      const io = socketUtil.getIo();
      if (io) {
        io.to(req.user._id.toString()).emit('saved_items_updated', {
          userId: req.user._id,
          action: 'unsaved',
          savedItemId: savedItem._id,
          itemType: savedItem.itemType,
          itemId: savedItem.itemId,
        });
      }
    } catch (e) {
      console.error('Failed to emit saved_items_updated socket event:', e);
    }

    res.json({ message: 'Item removed from saved items' });
  } catch (error) {
    console.error('Error unsaving item:', error);
    res.status(500).json({ message: 'Server error unsaving item.' });
  }
};

/**
 * @desc    Unsave an item by type and ID
 * @route   DELETE /api/saved-items/by-type
 * @access  Private
 */
const unsaveItemByType = async (req, res) => {
  try {
    const { itemType, itemId } = req.body;

    const savedItem = await SavedItem.findOne({
      user: req.user._id,
      itemType,
      itemId,
    });

    if (!savedItem) {
      return res.status(404).json({ message: 'Saved item not found' });
    }

    await savedItem.deleteOne();

    try {
      const io = socketUtil.getIo();
      if (io) {
        io.to(req.user._id.toString()).emit('saved_items_updated', {
          userId: req.user._id,
          action: 'unsaved',
          savedItemId: savedItem._id,
          itemType: savedItem.itemType,
          itemId: savedItem.itemId,
        });
      }
    } catch (e) {
      console.error('Failed to emit saved_items_updated socket event:', e);
    }

    res.json({ message: 'Item removed from saved items' });
  } catch (error) {
    console.error('Error unsaving item:', error);
    res.status(500).json({ message: 'Server error unsaving item.' });
  }
};

/**
 * @desc    Check if item is saved
 * @route   GET /api/saved-items/check/:itemType/:itemId
 * @access  Private
 */
const checkSaved = async (req, res) => {
  try {
    const { itemType, itemId } = req.params;

    const savedItem = await SavedItem.findOne({
      user: req.user._id,
      itemType,
      itemId,
    });

    res.json({ isSaved: !!savedItem, savedItem: savedItem || null });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getSavedItems,
  saveItem,
  unsaveItem,
  unsaveItemByType,
  checkSaved,
};