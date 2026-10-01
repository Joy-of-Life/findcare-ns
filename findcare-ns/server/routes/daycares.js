const express  = require('express');
const router   = express.Router();
const Daycare  = require('../models/Daycare');
const auth     = require('../middleware/auth');
const toPublicDaycare = require('../daycarePrivacy');

const SEARCH_FIELDS = ['name', 'address', 'city', 'description', 'language', 'ageRange', 'openHours'];
const SEARCH_STOP_WORDS = new Set(['a', 'an', 'and', 'care', 'childcare', 'daycare', 'daycares', 'find', 'for', 'in', 'looking', 'me', 'near', 'of', 'please', 'the', 'to', 'want', 'with']);
const OWNER_EDITABLE_FIELDS = [
  'name', 'address', 'city', 'phone', 'monthlyPrice', 'openHours', 'description',
  'language', 'ageRange', 'coordinates', 'availability', 'hideAddress', 'maxChildren',
  'daysOpen', 'opensAt', 'closesAt', 'acceptsSubsidy', 'mealsProvided', 'outdoorPlaySpace'
];
const SUPPORTED_AGE_GROUPS = ['infant', 'toddler', 'preschool', 'kindergarten', 'school-age'];
const SUPPORTED_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function validateOwnerListing(fields) {
  const requiredText = ['name', 'address', 'city', 'phone', 'description', 'openHours'];
  if (requiredText.some(field => typeof fields[field] !== 'string' || !fields[field].trim())) {
    return 'Complete all required daycare details';
  }
  if (fields.monthlyPrice === '' || !Number.isFinite(Number(fields.monthlyPrice)) || Number(fields.monthlyPrice) < 0) {
    return 'Enter a valid monthly price';
  }
  if (!Array.isArray(fields.language) || !fields.language.length) return 'Select at least one language';
  if (!Array.isArray(fields.ageRange) || !fields.ageRange.length || fields.ageRange.some(age => !SUPPORTED_AGE_GROUPS.includes(age))) {
    return 'Select at least one supported age group';
  }
  if (!Number.isInteger(Number(fields.maxChildren)) || Number(fields.maxChildren) < 1) return 'Enter the maximum number of children';
  if (!Array.isArray(fields.daysOpen) || !fields.daysOpen.length || fields.daysOpen.some(day => !SUPPORTED_DAYS.includes(day))) {
    return 'Select at least one valid open day';
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(fields.opensAt || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(fields.closesAt || '') || fields.opensAt >= fields.closesAt) {
    return 'Choose valid opening and closing times';
  }
  const latitude = fields.coordinates?.lat;
  const longitude = fields.coordinates?.lng;
  if (latitude === '' || longitude === '' || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) ||
      Number(latitude) < -90 || Number(latitude) > 90 || Number(longitude) < -180 || Number(longitude) > 180) {
    return 'Enter valid map coordinates';
  }
  return '';
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesSearch(daycare, terms) {
  const searchableText = SEARCH_FIELDS
    .map(field => daycare[field])
    .flat()
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return terms.every(term => searchableText.includes(term.toLowerCase()));
}

// GET /api/daycares — search with filters
router.get('/', async (req, res) => {
  try {
    const { city, search, ageRange, maxPrice, language, rating, availableOnly, lat, lng } = req.query;
    const searchTerms = typeof search === 'string'
      ? search.trim().split(/\s+/)
        .map(term => term.replace(/^[^\w]+|[^\w]+$/g, '').toLowerCase())
        .filter(term => term && !SEARCH_STOP_WORDS.has(term))
      : [];
    const onlyAvailable = availableOnly === true || availableOnly === 'true' ||
      (typeof search === 'string' && /\b(open|available)\s+spots?\b/i.test(search));
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
      if (searchTerms.length) result = result.filter(d => matchesSearch(d, searchTerms));
      if (city) result = result.filter(d => new RegExp(escapeRegex(city), 'i').test(d.city || ''));
      if (ageRange) result = result.filter(d => d.ageRange && d.ageRange.includes(ageRange));
      if (maxPrice) result = result.filter(d => d.monthlyPrice <= Number(maxPrice));
      if (language) result = result.filter(d => d.language && d.language.includes(language));
      if (rating) result = result.filter(d => d.rating >= Number(rating));
      if (onlyAvailable) {
        result = result.filter(d => ageRange
          ? (d.availability?.[ageRange] || 0) > 0
          : ['infant', 'toddler', 'preschool'].some(group => (d.availability?.[group] || 0) > 0));
      }

      return res.json(result.sort((a, b) => a.distanceFromUser - b.distanceFromUser).map(toPublicDaycare));
    }

    if (city)     query.city         = { $regex: escapeRegex(city), $options: 'i' };
    if (searchTerms.length) {
      query.$and = searchTerms.map(term => ({
        $or: SEARCH_FIELDS.map(field => ({
          [field]: { $regex: escapeRegex(term), $options: 'i' }
        }))
      }));
    }
    if (maxPrice) query.monthlyPrice = { $lte: Number(maxPrice) };
    if (language) query.language     = { $in: [language] };
    if (rating)   query.rating       = { $gte: Number(rating) };
    if (ageRange) query.ageRange     = { $in: [ageRange] };

    if (onlyAvailable) {
      const availabilityFilter = ageRange
        ? { [`availability.${ageRange}`]: { $gt: 0 } }
        : { $or: ['infant', 'toddler', 'preschool'].map(group => ({ [`availability.${group}`]: { $gt: 0 } })) };
      query.$and = [...(query.$and || []), availabilityFilter];
    }

    const daycares = await Daycare.find(query).sort({ rating: -1 });
    res.json(daycares.map(toPublicDaycare));

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
    res.json(toPublicDaycare(daycare));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/daycares — create new daycare (owner only)
router.post('/', auth, async (req, res) => {
  try {
    const validationError = validateOwnerListing(req.body);
    if (validationError) return res.status(400).json({ error: validationError });
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
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([field]) => OWNER_EDITABLE_FIELDS.includes(field))
    );
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No editable daycare fields provided' });
    }
    const validationError = validateOwnerListing({ ...daycare.toObject(), ...updates });
    if (validationError) return res.status(400).json({ error: validationError });
    const updated = await Daycare.findByIdAndUpdate(
      req.params.id, { $set: updates }, { new: true, runValidators: true }
    );
    const availability = updates.availability;
    const spotsJustOpened = availability && ['infant', 'toddler', 'preschool'].some(ageGroup =>
      (daycare.availability?.[ageGroup] || 0) === 0 && (availability[ageGroup] || 0) > 0
    );
    if (spotsJustOpened) {
      try {
        await fetch(`http://localhost:${process.env.PORT || 5000}/api/alerts/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ daycareId: req.params.id })
        });
      } catch (alertErr) {
        console.warn('Availability alert failed:', alertErr.message);
      }
    }
    res.json(updated);
  } catch (err) {
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ error: err.message });
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