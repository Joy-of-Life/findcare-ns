const mongoose = require('mongoose');
const NOVA_SCOTIA_CITIES = require('../constants/novaScotiaCities');
const SUPPORTED_AGE_GROUPS = require('../constants/ageGroups');
const PROVIDER_TYPES = ['licensedCentre', 'regulatedFamilyHome', 'unlicensedHome'];

const availabilitySchema = new mongoose.Schema({
  infant:    { type: Number, default: 0 },
  toddler:   { type: Number, default: 0 },
  preschool: { type: Number, default: 0 },
  kindergarten: { type: Number, default: 0 },
  'school-age': { type: Number, default: 0 },
}, { _id: false });

const complianceAttestationSchema = new mongoose.Schema({
  capacityConfirmed: { type: Boolean, required: true },
  unlicensedDisclosureConfirmed: { type: Boolean, default: false },
  guidanceRead: { type: Boolean, default: false },
  termsAccepted: { type: Boolean, required: true },
  marketingOptIn: { type: Boolean, default: false },
  acceptedAt: { type: Date, required: true },
}, { _id: false });

const providerCapacityAttestationSchema = new mongoose.Schema({
  providerType: { type: String, enum: PROVIDER_TYPES, required: true },
  maxChildren: { type: Number, min: 1, required: true },
  ageRange: { type: [{ type: String, enum: SUPPORTED_AGE_GROUPS }], default: [] },
  providerStatusConfirmed: { type: Boolean, default: false },
  unlicensedDisclosureConfirmed: { type: Boolean, default: false },
  acceptedAt: { type: Date, required: true },
}, { _id: false });

const licensingStatusAttestationSchema = new mongoose.Schema({
  licensed: { type: Boolean, required: true },
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
  facebookPageLink: {
    type: String,
    trim: true
  },
  city: {
    type:     String,
    required: true,
    enum: {
      values: NOVA_SCOTIA_CITIES,
      message: 'Select a city or community in Nova Scotia'
    }
  },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  ageRange: {
    type: [{ type: String, enum: SUPPORTED_AGE_GROUPS }],
    default: []
  },
  providerType: { type: String, enum: PROVIDER_TYPES },
  unlicensedHomeProvider: { type: Boolean, default: false },
  acceptsSubsidy: { type: Boolean, default: false },
  mealsProvided: { type: Boolean, default: false },
  outdoorPlaySpace: { type: Boolean, default: false },
  maxChildren:  { type: Number, min: 1 },
  daysOpen:     { type: [{ type: String, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] }], default: [] },
  opensAt:      { type: String },
  closesAt:     { type: String },
  dailyRate:     { type: Number, min: 0 },
  // Retained only for legacy records; it is never selected or used as a daily rate.
  monthlyPrice:  { type: Number, select: false },
  language:     { type: [String] },
  openHours:    { type: String },
  phone:        { type: String },
  photos:       { type: [String] },
  availability: { type: availabilitySchema, default: () => ({}) },
  complianceAttestation: { type: complianceAttestationSchema },
  providerCapacityAttestations: { type: [providerCapacityAttestationSchema], default: [] },
  licensingStatusAttestations: { type: [licensingStatusAttestationSchema], default: [] },
  rating:       { type: Number, default: 0 },
  reviewCount:  { type: Number, default: 0 },
  licensed:     { type: Boolean, default: false },
  verified:     { type: Boolean, default: false },
  description:  { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Daycare', daycareSchema);
