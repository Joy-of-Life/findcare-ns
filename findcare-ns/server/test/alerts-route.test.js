const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Daycare = require('../models/Daycare');
const Waitlist = require('../models/Waitlist');
const alertsRoutes = require('../routes/alerts');

const OWNER_ID = '000000000000000000000001';
const OTHER_OWNER_ID = '000000000000000000000002';
const PARENT_ID = '000000000000000000000003';
const DAYCARE_ID = '000000000000000000000004';
const JWT_SECRET = 'alerts-route-test-secret';
const originals = {
  userFind: User.find,
  daycareFindById: Daycare.findById,
  waitlistFind: Waitlist.find,
  jwtSecret: process.env.JWT_SECRET,
};

afterEach(() => {
  User.find = originals.userFind;
  Daycare.findById = originals.daycareFindById;
  Waitlist.find = originals.waitlistFind;
  if (originals.jwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originals.jwtSecret;
});

async function notify({ role, userId, token, body }) {
  process.env.JWT_SECRET = JWT_SECRET;
  const app = express();
  app.use(express.json());
  app.use('/api/alerts', alertsRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token !== null) {
      headers.Authorization = `Bearer ${token || jwt.sign({ id: userId, role }, JWT_SECRET)}`;
    }
    return await fetch(`http://127.0.0.1:${server.address().port}/api/alerts/notify`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
}

test('notification trigger requires an authenticated daycare owner', async () => {
  let daycareLookupCount = 0;
  Daycare.findById = async () => {
    daycareLookupCount += 1;
    return { owner: OWNER_ID };
  };

  const unauthenticatedResponse = await notify({
    token: null,
    body: { daycareId: DAYCARE_ID, increasedAvailability: { infant: 1 } },
  });
  assert.equal(unauthenticatedResponse.status, 401);
  assert.equal(daycareLookupCount, 0);

  const parentResponse = await notify({
    role: 'parent',
    userId: PARENT_ID,
    body: { daycareId: DAYCARE_ID, increasedAvailability: { infant: 1 } },
  });
  assert.equal(parentResponse.status, 403);
  assert.equal(daycareLookupCount, 0);

  const otherOwnerResponse = await notify({
    role: 'owner',
    userId: OTHER_OWNER_ID,
    body: { daycareId: DAYCARE_ID, increasedAvailability: { infant: 1 } },
  });
  assert.equal(otherOwnerResponse.status, 403);
  assert.equal(daycareLookupCount, 1);
});

test('daycare owner can trigger alerts for their own daycare', async () => {
  Daycare.findById = async () => ({ owner: OWNER_ID });
  Waitlist.find = async () => [];
  User.find = async () => [];

  const response = await notify({
    role: 'owner',
    userId: OWNER_ID,
    body: { daycareId: DAYCARE_ID, increasedAvailability: { infant: 1 } },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { message: 'No subscribers to notify' });
});
