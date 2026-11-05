const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');
const Daycare = require('../models/Daycare');
const daycareRoutes = require('../routes/daycares');

const originalSave = Daycare.prototype.save;
const originalJwtSecret = process.env.JWT_SECRET;

test.afterEach(() => {
  Daycare.prototype.save = originalSave;
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
});

test('daycare schema accepts daily rates and retains monthly rate as unselected legacy data', async () => {
  assert.equal(Daycare.schema.path('monthlyPrice').options.select, false);

  const daycare = new Daycare({
    owner: '000000000000000000000001',
    name: 'Daily Rate Daycare',
    address: '1 Main Street',
    city: 'Halifax',
    dailyRate: 25.5,
  });
  await assert.doesNotReject(daycare.validate());

  daycare.dailyRate = -1;
  await assert.rejects(daycare.validate(), error =>
    error.name === 'ValidationError' && Boolean(error.errors.dailyRate)
  );
});

test('daycare creation requires a daily rate and ignores legacy monthly price input', async () => {
  process.env.JWT_SECRET = 'daily-rate-test-secret';
  Daycare.prototype.save = async function save() { return this; };

  const app = express();
  app.use(express.json());
  app.use('/api/daycares', daycareRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  try {
    const token = jwt.sign({ id: '000000000000000000000001' }, process.env.JWT_SECRET);
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const baseListing = {
      name: 'Daily Rate Daycare',
      address: '1 Main Street',
      city: 'Halifax',
      phone: '902-555-0100',
      description: 'Care for infants',
      openHours: 'Mon–Fri, 7:00 AM – 5:00 PM',
      dailyRateAttestationConfirmed: true,
      language: ['English'],
      ageRange: ['infant'],
      maxChildren: 3,
      daysOpen: ['mon', 'tue', 'wed', 'thu', 'fri'],
      opensAt: '07:00',
      closesAt: '17:00',
      licensed: false,
      licensingStatusAttestationConfirmed: true,
      complianceAttestation: {
        capacityConfirmed: true,
        unlicensedDisclosureConfirmed: true,
        guidanceRead: true,
        termsAccepted: true,
      },
    };

    const missingRate = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...baseListing, monthlyPrice: 700 }),
    });
    assert.equal(missingRate.status, 400);
    assert.deepEqual(await missingRate.json(), { error: 'Enter a valid daily rate' });

    const unconfirmedRate = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...baseListing, dailyRate: 25.5, dailyRateAttestationConfirmed: false }),
    });
    assert.equal(unconfirmedRate.status, 400);
    assert.deepEqual(await unconfirmedRate.json(), { error: 'Confirm the daily rate attestation' });

    const withDailyRate = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...baseListing, dailyRate: 25.5, monthlyPrice: 700 }),
    });
    const savedDaycare = await withDailyRate.json();

    assert.equal(withDailyRate.status, 201);
    assert.equal(savedDaycare.dailyRate, 25.5);
    assert.equal(savedDaycare.monthlyPrice, undefined);
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});
