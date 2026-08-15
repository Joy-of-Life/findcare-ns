const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  infant:    { type: Number, default: 0 },
  toddler:   { type: Number, default: 0 },
  preschool: { type: Number, default: 0 }
}, { _id: false });

const daycareSchema = new mongoose.Schema({
  owner: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true
  },
  name: {
    type:     String,
    required: true,
    trim:     true
  },
  address: {
    type:     String,
    required: true
  },
  city: {
    type:     String,
    required: true
  },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  ageRange:     { type: [String] },
  monthlyPrice: { type: Number },
  language:     { type: [String] },
  openHours:    { type: String },
  phone:        { type: String },
  photos:       { type: [String] },
  availability: { type: availabilitySchema, default: () => ({}) },
  rating:       { type: Number, default: 0 },
  reviewCount:  { type: Number, default: 0 },
  licensed:     { type: Boolean, default: false },
  verified:     { type: Boolean, default: false },
  description:  { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Daycare', daycareSchema);
