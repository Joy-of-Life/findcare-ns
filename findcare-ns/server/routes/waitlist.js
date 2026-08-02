const express  = require('express');
const router   = express.Router();
const Waitlist = require('../models/Waitlist');
const auth     = require('../middleware/auth');

// GET /api/waitlist/my/all — get all waitlist entries for current parent
// IMPORTANT: this must be BEFORE /:daycareId or Express will treat 'my' as a daycareId
router.get('/my/all', auth, async (req, res) => {
  try {
    const entries = await Waitlist.find({
      parent: req.user.id,
      status: 'active'
    })
    .populate('daycare', 'name city address monthlyPrice')
    .sort({ createdAt: 1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/waitlist/:daycareId — get waitlist for a daycare (owner only)
router.get('/:daycareId', auth, async (req, res) => {
  try {
    const waitlist = await Waitlist.find({
      daycare: req.params.daycareId,
      status:  'active'
    })
    .populate('parent', 'name email')
    .sort({ createdAt: 1 });
    res.json(waitlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/waitlist/:daycareId — join waitlist
router.post('/:daycareId', auth, async (req, res) => {
  try {
    const { ageGroup, expectedStartDate, notes } = req.body;

    if (!ageGroup) {
      return res.status(400).json({ error: 'Age group is required' });
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
      expectedStartDate,
      notes,
      status:            'active'
    });

    await entry.save();
    const populated = await entry.populate('daycare', 'name city address');
    res.status(201).json(populated);

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
    const { status } = req.body;
    const entry = await Waitlist.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('parent', 'name email');
    res.json(entry);
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