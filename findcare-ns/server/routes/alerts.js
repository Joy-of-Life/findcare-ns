const express    = require('express');
const router     = express.Router();
const User       = require('../models/User');
const Daycare    = require('../models/Daycare');
const auth       = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

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
    const { daycareId } = req.body;

    const daycare = await Daycare.findById(daycareId);
    if (!daycare) return res.status(404).json({ error: 'Daycare not found' });

    // Find all parents who saved this daycare and have email alerts on
    const subscribers = await User.find({
      savedDaycares:      daycareId,
      'alertPrefs.email': true,
      role:               'parent'
    });

    console.log(`Found ${subscribers.length} subscribers for ${daycare.name}`);

    if (subscribers.length === 0) {
      return res.json({ message: 'No subscribers to notify' });
    }

    const totalSpots = (daycare.availability?.infant    || 0) +
                       (daycare.availability?.toddler   || 0) +
                       (daycare.availability?.preschool || 0);

    if (totalSpots === 0) {
      return res.json({ message: 'No spots available — no alerts sent' });
    }

    // Send email to each subscriber
    const emailPromises = subscribers.map(parent =>
      transporter.sendMail({
        from:    process.env.GMAIL_USER,
        to:      parent.email,
        subject: `🎉 Spot available at ${daycare.name} — FindCare NS`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#1D9E75;padding:24px;border-radius:8px 8px 0 0">
              <h1 style="color:#fff;margin:0;font-size:24px">FindCare</h1>
              <p style="color:rgba(255,255,255,0.85);margin:4px 0 0">Nova Scotia childcare</p>
            </div>
            <div style="background:#fff;padding:24px;border:1px solid #E8E6E0;border-top:none;border-radius:0 0 8px 8px">
              <h2 style="color:#2C2C2A;margin:0 0 8px">A spot just opened up!</h2>
              <p style="color:#6B7280;margin:0 0 20px">
                Good news, ${parent.name}! A spot has opened at one of your saved daycares.
              </p>
              <div style="background:#F8F7F4;border-radius:8px;padding:16px;margin-bottom:20px">
                <h3 style="color:#2C2C2A;margin:0 0 8px">${daycare.name}</h3>
                <p style="color:#6B7280;margin:0 0 4px">📍 ${daycare.address}, ${daycare.city}</p>
                <p style="color:#6B7280;margin:0 0 4px">📞 ${daycare.phone}</p>
                <p style="color:#6B7280;margin:0 0 4px">🕐 ${daycare.openHours}</p>
                <p style="color:#6B7280;margin:0">💰 $${daycare.monthlyPrice}/month</p>
              </div>
              <div style="background:#E1F5EE;border-radius:8px;padding:12px;margin-bottom:20px">
                <p style="color:#085041;margin:0;font-weight:500">
                  Available spots:
                  ${daycare.availability?.infant    > 0 ? `${daycare.availability.infant} infant · `    : ''}
                  ${daycare.availability?.toddler   > 0 ? `${daycare.availability.toddler} toddler · `  : ''}
                  ${daycare.availability?.preschool > 0 ? `${daycare.availability.preschool} preschool` : ''}
                </p>
              </div>
              <a href="${process.env.CLIENT_URL}/daycare/${daycare._id}"
                style="display:inline-block;background:#1D9E75;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500">
                View daycare →
              </a>
              <p style="color:#6B7280;font-size:12px;margin-top:20px">
                You received this because you saved ${daycare.name} on FindCare NS.
              </p>
            </div>
          </div>
        `
      })
    );

    await Promise.all(emailPromises);
    res.json({ message: `Notified ${subscribers.length} subscribers` });

  } catch (err) {
    console.error('Alert notify error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;