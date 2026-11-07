const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const Daycare  = require('../models/Daycare');
const Waitlist = require('../models/Waitlist');
const auth     = require('../middleware/auth');
const toPublicDaycare = require('../daycarePrivacy');

const SUPPORTED_AGE_GROUPS = ['infant', 'toddler', 'preschool', 'kindergarten', 'school-age'];
const NOVA_SCOTIA_TIME_ZONE = 'America/Halifax';
const ALLOWED_STATUS_TRANSITIONS = {
  active: ['filled', 'withdrawn'],
  filled: ['active'],
  withdrawn: [],
};

function getNovaScotiaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: NOVA_SCOTIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function isValidFutureStartDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) return false;

  const tomorrow = new Date(`${getNovaScotiaDate()}T00:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return value >= tomorrow.toISOString().slice(0, 10);
}

// GET /api/waitlist/my/all — get all waitlist entries for current parent
// IMPORTANT: this must be BEFORE /:daycareId or Express will treat 'my' as a daycareId
router.get('/my/all', auth, async (req, res) => {
  try {
    const entries = await Waitlist.find({
      parent: req.user.id,
      status: 'active'
    })
    .populate('daycare', 'name city address hideAddress dailyRate')
    .sort({ createdAt: 1 });
    res.json(entries.map(entry => {
      const result = entry.toObject();
      result.daycare = toPublicDaycare(result.daycare);
      return result;
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/waitlist/:daycareId — get waitlist for a daycare (owner only)
router.get('/:daycareId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only daycare owners can view waitlists' });
    }
    if (!mongoose.isValidObjectId(req.params.daycareId)) {
      return res.status(400).json({ error: 'Invalid daycare ID' });
    }
    const daycare = await Daycare.findById(req.params.daycareId);
    if (!daycare) return res.status(404).json({ error: 'Daycare not found' });
    if (daycare.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this waitlist' });
    }

    const waitlist = await Waitlist.find({
      daycare: req.params.daycareId,
      status:  'active'
    })
    .populate('parent', 'name email phone')
    .sort({ createdAt: 1, _id: 1 });
    res.json(waitlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/waitlist/:daycareId — join waitlist
router.post('/:daycareId', auth, async (req, res) => {
  try {
     // Only parents can join waitlists
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Only parents can join waitlists' });
    }
    const { ageGroup, expectedStartDate, notes } = req.body;

    if (!ageGroup) {
      return res.status(400).json({ error: 'Age group is required' });
    }
    if (!SUPPORTED_AGE_GROUPS.includes(ageGroup)) {
      return res.status(400).json({ error: 'Invalid age group' });
    }
    if (!isValidFutureStartDate(expectedStartDate)) {
      return res.status(400).json({
        error: 'Requested start date must be tomorrow or a future date.',
      });
    }

    // Check if already on waitlist
    const existing = await Waitlist.findOne({
      daycare:  req.params.daycareId,
      parent:   req.user.id,
      ageGroup,
      status:   'active'
    });
    if (existing) {
      return res.status(400).json({ error: 'You are already on this waitlist' });
    }

    // Get current position
    const count = await Waitlist.countDocuments({
      daycare:  req.params.daycareId,
      ageGroup,
      status:   'active'
    });

    const entry = new Waitlist({
      daycare:           req.params.daycareId,
      parent:            req.user.id,
      ageGroup,
      position:          count + 1,
      expectedStartDate: new Date(`${expectedStartDate}T00:00:00.000Z`),
      notes,
      status:            'active'
    });

    await entry.save();
    const populated = await entry.populate('daycare', 'name city address hideAddress');
    const result = populated.toObject();
    result.daycare = toPublicDaycare(result.daycare);
    res.status(201).json(result);

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'You are already on this waitlist' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/waitlist/:id/status — update waitlist status (owner only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only daycare owners can update waitlist status' });
    }
    const { status } = req.body;
    if (!Object.prototype.hasOwnProperty.call(ALLOWED_STATUS_TRANSITIONS, status)) {
      return res.status(400).json({ error: 'Invalid waitlist status' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid waitlist entry ID' });
    }
    const entry = await Waitlist.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Waitlist entry not found' });

    const daycare = await Daycare.findById(entry.daycare);
    if (!daycare) return res.status(404).json({ error: 'Daycare not found' });
    if (daycare.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this waitlist' });
    }
    if (!ALLOWED_STATUS_TRANSITIONS[entry.status].includes(status)) {
      return res.status(409).json({ error: `Cannot change waitlist status from ${entry.status} to ${status}` });
    }

    const updatedEntry = await Waitlist.findOneAndUpdate(
      { _id: req.params.id, status: entry.status },
      { $set: { status } },
      { new: true, runValidators: true }
    ).populate('parent', 'name email');
    if (!updatedEntry) {
      return res.status(409).json({ error: 'Waitlist status changed; reload and try again' });
    }
    res.json(updatedEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/waitlist/:daycareId — leave waitlist
router.delete('/:daycareId', auth, async (req, res) => {
  try {
    const { ageGroup } = req.body;
    await Waitlist.findOneAndDelete({
      daycare:  req.params.daycareId,
      parent:   req.user.id,
      ageGroup,
      status:   'active'
    });
    res.json({ message: 'Removed from waitlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;