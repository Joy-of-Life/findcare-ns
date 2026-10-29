const mongoose = require('mongoose');
const SUPPORTED_AGE_GROUPS = require('../constants/ageGroups');

const waitlistSchema = new mongoose.Schema({
  daycare: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Daycare',
    required: true
  },
  parent: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true
  },
  ageGroup: {
    type:     String,
    enum:     SUPPORTED_AGE_GROUPS,
    required: true
  },
  position: {
    type:    Number,
    default: 0
  },
  status: {
    type:    String,
    enum:    ['active', 'filled', 'withdrawn'],
    default: 'active'
  },
  notes: {
    type: String
  },
  expectedStartDate: {
    type: Date
  },
  notified: {
    type:    Boolean,
    default: false
  }
}, { timestamps: true });

// One waitlist entry per parent per daycare per age group
waitlistSchema.index({ daycare: 1, parent: 1, ageGroup: 1 }, { unique: true });

module.exports = mongoose.model('Waitlist', waitlistSchema);
