const User = require('../models/User');
const Daycare = require('../models/Daycare');
const Waitlist = require('../models/Waitlist');
const AGE_GROUPS = require('../constants/ageGroups');
const { sendEmail } = require('./emailService');

async function sendAvailabilityAlerts(daycareId, increasedAvailability = {}) {
  const daycare = await Daycare.findById(daycareId);
  if (!daycare) return { status: 404, message: 'Daycare not found' };

  const availableIncreases = increasedAvailability;
  const increasedGroups = Object.keys(availableIncreases)
    .filter(ageGroup => AGE_GROUPS.includes(ageGroup) && availableIncreases[ageGroup] > 0);

  if (increasedGroups.length === 0) {
    return { status: 200, message: 'No availability increases to notify' };
  }

  const waitlistEntries = await Waitlist.find({
    daycare: daycareId,
    status: 'active',
  });
  const waitlistedGroupsByParent = new Map();
  for (const entry of waitlistEntries) {
    const parentId = entry.parent.toString();
    if (!waitlistedGroupsByParent.has(parentId)) waitlistedGroupsByParent.set(parentId, new Set());
    waitlistedGroupsByParent.get(parentId).add(entry.ageGroup);
  }

  const waitlistedParentIds = [...waitlistedGroupsByParent.keys()];
  const waitlistedParents = waitlistedParentIds.length
    ? await User.find({ _id: { $in: waitlistedParentIds }, role: 'parent' })
    : [];
  const waitlistedParentsById = new Map(
    waitlistedParents.map(parent => [parent._id.toString(), parent])
  );
  const subscribers = await User.find({
    savedDaycares: daycareId,
    'alertPrefs.email': true,
    role: 'parent',
  });

  const recipients = [];
  for (const [parentId, ageGroups] of waitlistedGroupsByParent) {
    const parent = waitlistedParentsById.get(parentId);
    const matchingGroups = increasedGroups.filter(ageGroup => ageGroups.has(ageGroup));
    if (parent && matchingGroups.length > 0) {
      recipients.push({ parent, ageGroups: matchingGroups, isWaitlisted: true });
    }
  }
  for (const parent of subscribers) {
    if (!waitlistedGroupsByParent.has(parent._id.toString())) {
      recipients.push({ parent, ageGroups: increasedGroups, isWaitlisted: false });
    }
  }

  if (recipients.length === 0) {
    return { status: 200, message: 'No subscribers to notify' };
  }

  await Promise.all(recipients.map(({ parent, ageGroups, isWaitlisted }) =>
    sendEmail({
      to: parent.email,
      subject: `🎉 Availability increased at ${daycare.name} — FindCare NS`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1D9E75;padding:24px;border-radius:8px 8px 0 0">
            <h1 style="color:#fff;margin:0;font-size:24px">FindCare</h1>
            <p style="color:rgba(255,255,255,0.85);margin:4px 0 0">Nova Scotia childcare</p>
          </div>
          <div style="background:#fff;padding:24px;border:1px solid #E8E6E0;border-top:none;border-radius:0 0 8px 8px">
            <h2 style="color:#2C2C2A;margin:0 0 8px">A spot just opened up!</h2>
            <p style="color:#6B7280;margin:0 0 20px">
              Good news, ${parent.name}! Availability has increased at ${daycare.name}.
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
                Newly available spots:
                ${ageGroups.map(ageGroup => `${availableIncreases[ageGroup]} ${ageGroup}`).join(' · ')}
              </p>
            </div>
            <a href="${process.env.CLIENT_URL}/daycare/${daycare._id}"
              style="display:inline-block;background:#1D9E75;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500">
              View daycare →
            </a>
            <p style="color:#6B7280;font-size:12px;margin-top:20px">
              ${isWaitlisted
                ? `You received this because you joined the waitlist for ${ageGroups.join(', ')} at ${daycare.name}.`
                : `You received this because you saved ${daycare.name} on FindCare NS.`}
            </p>
          </div>
        </div>
      `,
    })
  ));

  return { status: 200, message: `Notified ${recipients.length} subscribers` };
}

module.exports = sendAvailabilityAlerts;
