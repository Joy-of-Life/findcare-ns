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
  hideAddress: {
    type: Boolean,
    default: false
  },
  city: {
    type:     String,
    required: true
  },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  ageRange: {
    type: [{ type: String, enum: ['infant', 'toddler', 'preschool', 'kindergarten', 'school-age'] }],
    default: []
  },
  acceptsSubsidy: { type: Boolean, default: false },
  mealsProvided: { type: Boolean, default: false },
  outdoorPlaySpace: { type: Boolean, default: false },
  maxChildren:  { type: Number, min: 1 },
  daysOpen:     { type: [{ type: String, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] }], default: [] },
  opensAt:      { type: String },
  closesAt:     { type: String },
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
