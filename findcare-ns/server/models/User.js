const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: true,
    trim:     true
  },
  email: {
    type:     String,
    required: true,
    unique:   true,
    lowercase: true,
    trim:     true
  },
  password: {
    type:     String,
    required: true,
    minlength: 6
  },
  role: {
    type:    String,
    enum:    ['parent', 'owner', 'admin'],
    default: 'parent'
  },
  verified: {
    type:    Boolean,
    default: false
  },
  verifyToken: {
    type: String
  },
  savedDaycares: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Daycare'
  }],
  alertPrefs: {
    email:     { type: Boolean, default: true },
    ageGroups: { type: [String], default: [] }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
