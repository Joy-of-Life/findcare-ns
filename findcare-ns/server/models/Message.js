const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true
  },
  to: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true
  },
  daycare: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Daycare'
  },
  text: {
    type:     String,
    required: true,
    maxlength: 2000
  },
  read: {
    type:    Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
