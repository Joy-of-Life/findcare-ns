const express  = require('express');
const router   = express.Router();
const Daycare  = require('../models/Daycare');
const auth     = require('../middleware/auth');

// GET /api/daycares — search with filters
router.get('/', async (req, res) => {
  try {
    const { city, ageRange, maxPrice, language, rating, availableOnly, lat, lng, radius } = req.query;
    const query = {};

    // If lat/lng provided, filter by distance (hardcoded to 25km)
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const SEARCH_RADIUS = 25; // Fixed 25km radius

      console.log('🔍 GPS Search:', { userLat, userLng, SEARCH_RADIUS });

      // Haversine formula to calculate distance
      const daycares = await Daycare.find({ 'coordinates.lat': { $exists: true }, 'coordinates.lng': { $exists: true } });
      
      console.log(`📍 Found ${daycares.length} daycares with coordinates`);
      
      const nearby = daycares
        .map(daycare => {
          if (!daycare.coordinates || !daycare.coordinates.lat || !daycare.coordinates.lng) return null;
          
          const R = 6371; // Earth's radius in km
          const dLat = (daycare.coordinates.lat - userLat) * Math.PI / 180;
          const dLng = (daycare.coordinates.lng - userLng) * Math.PI / 180;
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(daycare.coordinates.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          
          console.log(`  ${daycare.name} (${daycare.city}): ${distance.toFixed(2)}km`);
          
          if (distance <= SEARCH_RADIUS) {
            return {
              ...daycare.toObject(),
              distanceFromUser: Math.round(distance * 10) / 10 // Round to 1 decimal place
            };
          }
          return null;
        })
        .filter(item => item !== null);

      console.log(`✅ ${nearby.length} daycares within ${SEARCH_RADIUS}km`);

      // Apply other filters
      let result = nearby;
      if (ageRange) result = result.filter(d => d.ageRange && d.ageRange.includes(ageRange));
      if (maxPrice) result = result.filter(d => d.monthlyPrice <= Number(maxPrice));
      if (language) result = result.filter(d => d.language && d.language.includes(language));
      if (rating) result = result.filter(d => d.rating >= Number(rating));
      if (availableOnly && ageRange) {
        result = result.filter(d => (d.availability?.[ageRange] || 0) > 0);
      }

      return res.json(result.sort((a, b) => b.rating - a.rating));
    }

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

// GET /api/daycares/my — get current owner's daycare
router.get('/my', auth, async (req, res) => {
  try {
    const daycare = await Daycare.findOne({ owner: req.user.id });
    if (!daycare) return res.status(404).json({ error: 'No daycare found' });
    res.json(daycare);
  } catch (err) {
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

    console.log('Availability update received:', { infant, toddler, preschool });

    const current = await Daycare.findById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Daycare not found' });

    const hadSpots = (current.availability?.infant    || 0) +
                 (current.availability?.toddler   || 0) +
                 (current.availability?.preschool || 0);

const updated = await Daycare.findByIdAndUpdate(
  req.params.id,
  { $set: {
    'availability.infant':    infant,
    'availability.toddler':   toddler,
    'availability.preschool': preschool,
  }},
  { new: true }
);

const nowHasSpots = (infant    || 0) +
                    (toddler   || 0) +
                    (preschool || 0);

// Trigger alert if ANY age group went from 0 to having spots
const infantOpened    = (current.availability?.infant    || 0) === 0 && (infant    || 0) > 0;
const toddlerOpened   = (current.availability?.toddler   || 0) === 0 && (toddler   || 0) > 0;
const preschoolOpened = (current.availability?.preschool || 0) === 0 && (preschool || 0) > 0;
const spotsJustOpened = infantOpened || toddlerOpened || preschoolOpened;

console.log('Spots just opened:', spotsJustOpened, { infantOpened, toddlerOpened, preschoolOpened });

if (spotsJustOpened) {
  try {
    console.log('Triggering alert...');
    await fetch(`http://localhost:${process.env.PORT || 5000}/api/alerts/notify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ daycareId: req.params.id })
    });
    console.log('Alert triggered successfully!');
  } catch (alertErr) {
    console.log('Alert trigger failed:', alertErr.message);
  }
}

    res.json(updated);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/daycares/:id — remove a daycare (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const daycare = await Daycare.findById(req.params.id);
    if (!daycare) return res.status(404).json({ error: 'Daycare not found' });
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await daycare.deleteOne();
    res.json({ message: 'Daycare deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;