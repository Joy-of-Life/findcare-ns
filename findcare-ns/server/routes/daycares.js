const express  = require('express');
const router   = express.Router();
const Daycare  = require('../models/Daycare');
const auth     = require('../middleware/auth');

// GET /api/daycares — search with filters
router.get('/', async (req, res) => {
  try {
    const { city, ageRange, maxPrice, language, rating, availableOnly } = req.query;
    const query = {};

    if (city)     query.city         = { $regex: city, $options: 'i' };
    if (maxPrice) query.monthlyPrice = { $lte: Number(maxPrice) };
    if (language) query.language     = { $in: [language] };
    if (rating)   query.rating       = { $gte: Number(rating) };
    if (ageRange) query.ageRange     = { $in: [ageRange] };

    if (availableOnly && ageRange) {
      query[`availability.${ageRange}`] = { $gt: 0 };
    }

    const daycares = await Daycare.find(query).sort({ rating: -1 });
    res.json(daycares);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/daycares/:id — single daycare
router.get('/:id', async (req, res) => {
  try {
    const daycare = await Daycare.findById(req.params.id);
    if (!daycare) return res.status(404).json({ error: 'Daycare not found' });
    res.json(daycare);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/daycares — create new daycare (owner only)
router.post('/', auth, async (req, res) => {
  try {
    const daycare = new Daycare({
      ...req.body,
      owner: req.user.id
    });
    const saved = await daycare.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/daycares/:id — update daycare (owner only)
router.patch('/:id', auth, async (req, res) => {
  try {
    const daycare = await Daycare.findById(req.params.id);
    if (!daycare) return res.status(404).json({ error: 'Daycare not found' });
    if (daycare.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const updated = await Daycare.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/daycares/:id/availability — update spots (owner only)
router.patch('/:id/availability', auth, async (req, res) => {
  try {
    const { infant, toddler, preschool } = req.body;
    const updated = await Daycare.findByIdAndUpdate(
      req.params.id,
      { $set: {
        'availability.infant':    infant,
        'availability.toddler':   toddler,
        'availability.preschool': preschool,
      }},
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;