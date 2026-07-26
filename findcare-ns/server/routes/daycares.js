const express  = require('express');
const router   = express.Router();
const Daycare  = require('../models/Daycare');

// GET /api/daycares
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

module.exports = router;
