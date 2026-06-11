const mongoose = require('mongoose');

const validationTipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startAt: {
    type: Date,
    default: null
  },
  endAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('ValidationTip', validationTipSchema);
