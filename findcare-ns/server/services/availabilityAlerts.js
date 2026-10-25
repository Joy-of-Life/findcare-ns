const User = require('../models/User');
const Daycare = require('../models/Daycare');
const transporter = require('./emailTransporter');

async function sendAvailabilityAlerts(daycareId) {
  const daycare = await Daycare.findById(daycareId);
  if (!daycare) return { status: 404, message: 'Daycare not found' };

  const subscribers = await User.find({
    savedDaycares: daycareId,
    'alertPrefs.email': true,
    role: 'parent',
  });

  console.log(`Found ${subscribers.length} subscribers for ${daycare.name}`);

  if (subscribers.length === 0) {
    return { status: 200, message: 'No subscribers to notify' };
  }

  const totalSpots = ['infant', 'toddler', 'preschool', 'kindergarten', 'school-age']
    .reduce((total, ageGroup) => total + (daycare.availability?.[ageGroup] || 0), 0);
  const availableByAge = ['infant', 'toddler', 'preschool', 'kindergarten', 'school-age']
    .filter(ageGroup => daycare.availability?.[ageGroup] > 0)
    .map(ageGroup => `${daycare.availability[ageGroup]} ${ageGroup}`)
    .join(' · ');

  if (totalSpots === 0) {
    return { status: 200, message: 'No spots available — no alerts sent' };
  }

  await Promise.all(subscribers.map(parent =>
    transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: parent.email,
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
              <p style="color:#6B7280;margin:0 0 4px">📍 ${daycare.hideAddress ? daycare.city : `${daycare.address}, ${daycare.city}`}</p>
              <p style="color:#6B7280;margin:0 0 4px">📞 ${daycare.phone}</p>
              <p style="color:#6B7280;margin:0 0 4px">🕐 ${daycare.openHours}</p>
              <p style="color:#6B7280;margin:0">💰 $${daycare.monthlyPrice}/month</p>
            </div>
            <div style="background:#E1F5EE;border-radius:8px;padding:12px;margin-bottom:20px">
              <p style="color:#085041;margin:0;font-weight:500">
                Available spots:
                ${availableByAge}
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
      `,
    })
  ));

  return { status: 200, message: `Notified ${subscribers.length} subscribers` };
}

module.exports = sendAvailabilityAlerts;
