const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  infant:    { type: Number, default: 0 },
  toddler:   { type: Number, default: 0 },
  preschool: { type: Number, default: 0 },
  kindergarten: { type: Number, default: 0 },
  'school-age': { type: Number, default: 0 },
}, { _id: false });

const complianceAttestationSchema = new mongoose.Schema({
  capacityConfirmed: { type: Boolean, required: true },
  unlicensedDisclosureConfirmed: { type: Boolean, required: true },
  guidanceRead: { type: Boolean, required: true },
  termsAccepted: { type: Boolean, required: true },
  marketingOptIn: { type: Boolean, default: false },
  acceptedAt: { type: Date, required: true },
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
  unlicensedHomeProvider: { type: Boolean, default: false },
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
  complianceAttestation: { type: complianceAttestationSchema },
  rating:       { type: Number, default: 0 },
  reviewCount:  { type: Number, default: 0 },
  licensed:     { type: Boolean, default: false },
  verified:     { type: Boolean, default: false },
  description:  { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Daycare', daycareSchema);
