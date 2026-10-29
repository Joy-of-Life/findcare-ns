const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const User = require('../models/User');
const Daycare = require('../models/Daycare');
const Waitlist = require('../models/Waitlist');
const sendAvailabilityAlerts = require('../services/availabilityAlerts');

const originalUserFind = User.find;
const originalDaycareFindById = Daycare.findById;
const originalWaitlistFind = Waitlist.find;
const originalFetch = global.fetch;
const originalEnv = {
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.RESEND_FROM_EMAIL,
  clientUrl: process.env.CLIENT_URL,
};

afterEach(() => {
  User.find = originalUserFind;
  Daycare.findById = originalDaycareFindById;
  Waitlist.find = originalWaitlistFind;
  global.fetch = originalFetch;
  if (originalEnv.apiKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalEnv.apiKey;
  if (originalEnv.from === undefined) delete process.env.RESEND_FROM_EMAIL;
  else process.env.RESEND_FROM_EMAIL = originalEnv.from;
  if (originalEnv.clientUrl === undefined) delete process.env.CLIENT_URL;
  else process.env.CLIENT_URL = originalEnv.clientUrl;
});

test('waitlisted parents receive only increased categories they joined; saved non-waitlisted parents get all increases', async () => {
  const waitlistedParent = {
    _id: 'parent-waitlisted',
    name: 'Waitlisted Parent',
    email: 'waitlisted@example.com',
  };
  const savedParent = {
    _id: 'parent-saved',
    name: 'Saved Parent',
    email: 'saved@example.com',
  };
  const sentEmails = [];

  Daycare.findById = async () => ({
    _id: 'daycare-1',
    name: 'Test Daycare',
    address: '1 Main Street',
    city: 'Halifax',
    phone: '902-555-0100',
    openHours: '7:00am – 5:00pm',
    monthlyPrice: 700,
    availability: { infant: 2, toddler: 3, preschool: 4, kindergarten: 0, 'school-age': 1 },
  });
  Waitlist.find = async () => [
    { parent: waitlistedParent._id, ageGroup: 'infant' },
    { parent: waitlistedParent._id, ageGroup: 'school-age' },
    { parent: 'parent-other-category', ageGroup: 'toddler' },
  ];
  User.find = async query => query._id
    ? [waitlistedParent]
    : [waitlistedParent, savedParent];
  process.env.RESEND_API_KEY = 'test-api-key';
  process.env.RESEND_FROM_EMAIL = 'FindCare <alerts@example.com>';
  process.env.CLIENT_URL = 'https://findcare.example.com';
  global.fetch = async (url, options) => {
    sentEmails.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ id: 'email-id' }) };
  };

  const result = await sendAvailabilityAlerts('daycare-1', {
    infant: 2,
    preschool: 4,
  });

  assert.equal(result.message, 'Notified 2 subscribers');
  assert.deepEqual(sentEmails.map(email => email.to).sort(), [
    'saved@example.com',
    'waitlisted@example.com',
  ]);
  const waitlistedEmail = sentEmails.find(email => email.to === 'waitlisted@example.com');
  assert.match(waitlistedEmail.html, /2 infant/);
  assert.doesNotMatch(waitlistedEmail.html, /4 preschool/);
  assert.match(waitlistedEmail.html, /joined the waitlist for infant/);

  const savedEmail = sentEmails.find(email => email.to === 'saved@example.com');
  assert.match(savedEmail.html, /2 infant/);
  assert.match(savedEmail.html, /4 preschool/);
  assert.match(savedEmail.html, /saved Test Daycare/);
});

test('no alert is sent when there are no availability increases', async () => {
  Daycare.findById = async () => ({ availability: { infant: 2 } });
  global.fetch = () => assert.fail('No email should be sent');

  const result = await sendAvailabilityAlerts('daycare-1', {});

  assert.equal(result.message, 'No availability increases to notify');
});
