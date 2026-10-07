const express = require('express');
const User = require('../models/User');
const Daycare = require('../models/Daycare');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [familiesConnected, licensedDaycares, totalDaycares] = await Promise.all([
      User.countDocuments({ role: 'parent' }),
      Daycare.countDocuments({ licensed: true }),
      Daycare.countDocuments(),
    ]);

    res.set('Cache-Control', 'no-store');
    res.json({ familiesConnected, licensedDaycares, totalDaycares });
  } catch (error) {
    console.error('Unable to load homepage stats:', error);
    res.status(500).json({ error: 'Unable to load homepage stats' });
  }
});

module.exports = router;