const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  rating: {
    type:     Number,
    required: true,
    min:      1,
    max:      5
  },
  // Retained for legacy records; new ratings do not capture or expose comments.
  text: {
    type:      String,
    maxlength: 1000,
    select:    false
  },
  verified: {
    type:    Boolean,
    default: false
  },
  helpfulCount: {
    type:    Number,
    default: 0
  }
}, { timestamps: true });

// One rating per parent per daycare
reviewSchema.index({ daycare: 1, parent: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
