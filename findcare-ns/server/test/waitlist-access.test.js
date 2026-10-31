const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');
const Daycare = require('../models/Daycare');
const Waitlist = require('../models/Waitlist');
const waitlistRoutes = require('../routes/waitlist');

const OWNER_ID = '000000000000000000000001';
const OTHER_OWNER_ID = '000000000000000000000002';
const PARENT_ID = '000000000000000000000003';
const DAYCARE_ID = '000000000000000000000004';
const ENTRY_ID = '000000000000000000000005';
const JWT_SECRET = 'waitlist-access-test-secret';
const originals = {
  daycareFindById: Daycare.findById,
  waitlistFind: Waitlist.find,
  waitlistFindById: Waitlist.findById,
  waitlistFindOneAndUpdate: Waitlist.findOneAndUpdate,
  jwtSecret: process.env.JWT_SECRET,
};

afterEach(() => {
  Daycare.findById = originals.daycareFindById;
  Waitlist.find = originals.waitlistFind;
  Waitlist.findById = originals.waitlistFindById;
  Waitlist.findOneAndUpdate = originals.waitlistFindOneAndUpdate;
  if (originals.jwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originals.jwtSecret;
});

async function requestWaitlist({ role, userId, method, path, body }) {
  process.env.JWT_SECRET = JWT_SECRET;
  const app = express();
  app.use(express.json());
  app.use('/api/waitlist', waitlistRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  try {
    const token = jwt.sign({ id: userId, role }, JWT_SECRET);
    return await fetch(`http://127.0.0.1:${server.address().port}/api/waitlist${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
}

test('only the daycare owner can list its waitlist; parents and other owners are denied', async () => {
  let waitlistRead = false;
  Daycare.findById = async () => ({ owner: OWNER_ID });
  Waitlist.find = () => {
    waitlistRead = true;
    return {
      populate: () => ({
        sort: async () => [],
      }),
    };
  };

  const parentResponse = await requestWaitlist({
    role: 'parent', userId: PARENT_ID, method: 'GET', path: `/${DAYCARE_ID}`,
  });
  assert.equal(parentResponse.status, 403);
  assert.equal(waitlistRead, false);

  const otherOwnerResponse = await requestWaitlist({
    role: 'owner', userId: OTHER_OWNER_ID, method: 'GET', path: `/${DAYCARE_ID}`,
  });
  assert.equal(otherOwnerResponse.status, 403);
  assert.equal(waitlistRead, false);

  Daycare.findById = async () => ({ owner: OWNER_ID });
  const ownerResponse = await requestWaitlist({
    role: 'owner', userId: OWNER_ID, method: 'GET', path: `/${DAYCARE_ID}`,
  });
  assert.equal(ownerResponse.status, 200);
  assert.equal(waitlistRead, true);
});

test('only the daycare owner can update a waitlist entry status', async () => {
  let updateAttempted = false;
  Waitlist.findById = async () => ({ daycare: DAYCARE_ID, status: 'active' });
  Daycare.findById = async () => ({ owner: OWNER_ID });
  Waitlist.findOneAndUpdate = () => {
    updateAttempted = true;
    return { populate: async () => ({ _id: ENTRY_ID, status: 'filled' }) };
  };

  const parentResponse = await requestWaitlist({
    role: 'parent',
    userId: PARENT_ID,
    method: 'PATCH',
    path: `/${ENTRY_ID}/status`,
    body: { status: 'filled' },
  });
  assert.equal(parentResponse.status, 403);
  assert.equal(updateAttempted, false);

  const otherOwnerResponse = await requestWaitlist({
    role: 'owner',
    userId: OTHER_OWNER_ID,
    method: 'PATCH',
    path: `/${ENTRY_ID}/status`,
    body: { status: 'filled' },
  });
  assert.equal(otherOwnerResponse.status, 403);
  assert.equal(updateAttempted, false);

  const ownerResponse = await requestWaitlist({
    role: 'owner',
    userId: OWNER_ID,
    method: 'PATCH',
    path: `/${ENTRY_ID}/status`,
    body: { status: 'filled' },
  });
  assert.equal(ownerResponse.status, 200);
  assert.equal(updateAttempted, true);
});

test('waitlist status updates reject unknown values and disallowed transitions', async () => {
  let updateAttempted = false;
  Waitlist.findById = async () => ({ daycare: DAYCARE_ID, status: 'filled' });
  Daycare.findById = async () => ({ owner: OWNER_ID });
  Waitlist.findOneAndUpdate = () => {
    updateAttempted = true;
    return { populate: async () => ({ _id: ENTRY_ID }) };
  };

  const unknownStatusResponse = await requestWaitlist({
    role: 'owner',
    userId: OWNER_ID,
    method: 'PATCH',
    path: `/${ENTRY_ID}/status`,
    body: { status: 'deleted' },
  });
  assert.equal(unknownStatusResponse.status, 400);
  assert.equal(updateAttempted, false);

  const invalidTransitionResponse = await requestWaitlist({
    role: 'owner',
    userId: OWNER_ID,
    method: 'PATCH',
    path: `/${ENTRY_ID}/status`,
    body: { status: 'withdrawn' },
  });
  assert.equal(invalidTransitionResponse.status, 409);
  assert.equal(updateAttempted, false);
});
