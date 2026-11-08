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
  phone: {
    type: String,
    match: /^\d{10}$/
  },
  password: {
    type:     String,
    required: true
  },
  authVersion: {
    type: Number,
    default: 0,
    select: false,
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
    type: String,
    select: false
  },
  verifyTokenExpiresAt: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpiresAt: {
    type: Date,
    select: false
  },
  savedDaycares: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Daycare'
  }],
  savedDaycareHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Daycare'
  }],
  alertPrefs: {
    email:     { type: Boolean, default: true },
    ageGroups: { type: [String], default: [] }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
