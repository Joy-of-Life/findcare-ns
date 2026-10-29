const express    = require('express');
const router     = express.Router();
const User       = require('../models/User');
const auth       = require('../middleware/auth');
const SUPPORTED_AGE_GROUPS = require('../constants/ageGroups');
const sendAvailabilityAlerts = require('../services/availabilityAlerts');

// POST /api/alerts/subscribe — turn on alerts
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { ageGroups } = req.body;
    const user = await User.findById(req.user.id);

    user.alertPrefs = {
      email:     true,
      ageGroups: ageGroups || ['infant', 'toddler', 'preschool']
    };

    await user.save();
    res.json({ message: 'Alerts turned on', alertPrefs: user.alertPrefs });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alerts/unsubscribe — turn off alerts
router.patch('/unsubscribe', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.alertPrefs = { email: false, ageGroups: [] };
    await user.save();
    res.json({ message: 'Alerts turned off' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts/notify — triggered when availability opens up
router.post('/notify', async (req, res) => {
  try {
    const { daycareId, increasedAvailability } = req.body;
    if (!daycareId || !increasedAvailability || typeof increasedAvailability !== 'object' ||
        Array.isArray(increasedAvailability)) {
      return res.status(400).json({ error: 'Daycare ID and availability increases are required' });
    }
    const hasInvalidIncrease = Object.entries(increasedAvailability).some(([ageGroup, count]) =>
      !SUPPORTED_AGE_GROUPS.includes(ageGroup) || !Number.isInteger(count) || count < 1
    );
    if (hasInvalidIncrease) {
      return res.status(400).json({ error: 'Availability increases must contain valid age groups and positive whole-number counts' });
    }
    const result = await sendAvailabilityAlerts(daycareId, increasedAvailability);
    res.status(result.status).json(
      result.status === 404 ? { error: result.message } : { message: result.message }
    );

  } catch (err) {
    console.error('Alert notify error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;