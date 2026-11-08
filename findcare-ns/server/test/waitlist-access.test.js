const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
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
  userFindById: User.findById,
  daycareFindById: Daycare.findById,
  waitlistFind: Waitlist.find,
  waitlistFindOne: Waitlist.findOne,
  waitlistCountDocuments: Waitlist.countDocuments,
  waitlistFindById: Waitlist.findById,
  waitlistFindOneAndUpdate: Waitlist.findOneAndUpdate,
  waitlistSave: Waitlist.prototype.save,
  waitlistPopulate: Waitlist.prototype.populate,
  jwtSecret: process.env.JWT_SECRET,
};

afterEach(() => {
  User.findById = originals.userFindById;
  Daycare.findById = originals.daycareFindById;
  Waitlist.find = originals.waitlistFind;
  Waitlist.findOne = originals.waitlistFindOne;
  Waitlist.countDocuments = originals.waitlistCountDocuments;
  Waitlist.findById = originals.waitlistFindById;
  Waitlist.findOneAndUpdate = originals.waitlistFindOneAndUpdate;
  Waitlist.prototype.save = originals.waitlistSave;
  Waitlist.prototype.populate = originals.waitlistPopulate;
  if (originals.jwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originals.jwtSecret;
});

async function requestWaitlist({ role, userId, method, path, body }) {
  process.env.JWT_SECRET = JWT_SECRET;
  User.findById = () => ({ select: async () => ({ authVersion: 0 }) });
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

function novaScotiaToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Halifax',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function addDays(date, days) {
  const result = new Date(`${date}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

test('only the daycare owner can list its waitlist; parents and other owners are denied', async () => {
  let waitlistRead = false;
  let populatedParentFields = '';
  Daycare.findById = async () => ({ owner: OWNER_ID });
  Waitlist.find = () => {
    waitlistRead = true;
    return {
      populate: (path, fields) => {
        if (path === 'parent') populatedParentFields = fields;
        return {
        sort: async () => [],
        };
      },
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
  assert.equal(populatedParentFields, 'name email phone');
});

test('joining a waitlist requires a valid requested start date of tomorrow or later', async () => {
  const today = novaScotiaToday();
  const invalidDates = [
    undefined,
    '',
    'not-a-date',
    '2026-02-30',
    addDays(today, -1),
    today,
  ];

  for (const expectedStartDate of invalidDates) {
    const response = await requestWaitlist({
      role: 'parent',
      userId: PARENT_ID,
      method: 'POST',
      path: `/${DAYCARE_ID}`,
      body: { ageGroup: 'infant', expectedStartDate },
    });
    assert.equal(response.status, 400);
    assert.equal(
      (await response.json()).error,
      'Requested start date must be tomorrow or a future date.'
    );
  }
});

test('joining a waitlist accepts tomorrow and stores the requested calendar date', async () => {
  const tomorrow = addDays(novaScotiaToday(), 1);
  Waitlist.findOne = async () => null;
  Waitlist.countDocuments = async () => 0;
  Waitlist.prototype.save = async function save() {};
  Waitlist.prototype.populate = async function populate() {
    return {
      toObject: () => ({
        _id: ENTRY_ID,
        position: this.position,
        expectedStartDate: this.expectedStartDate,
        daycare: { name: 'Example daycare', city: 'Halifax' },
      }),
    };
  };

  const response = await requestWaitlist({
    role: 'parent',
    userId: PARENT_ID,
    method: 'POST',
    path: `/${DAYCARE_ID}`,
    body: { ageGroup: 'infant', expectedStartDate: tomorrow },
  });

  assert.equal(response.status, 201);
  const entry = await response.json();
  assert.equal(entry.expectedStartDate, `${tomorrow}T00:00:00.000Z`);
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
