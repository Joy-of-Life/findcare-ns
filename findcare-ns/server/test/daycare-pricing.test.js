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
      capacityAttestationConfirmed: true,
      providerStatusAttestationConfirmed: true,
      language: ['English'],
      ageRange: ['infant'],
      maxChildren: 3,
      daysOpen: ['mon', 'tue', 'wed', 'thu', 'fri'],
      opensAt: '07:00',
      closesAt: '17:00',
      complianceAttestation: {
        unlicensedDisclosureConfirmed: true,
        guidanceRead: true,
        termsAccepted: true,
      },
      providerType: 'unlicensedHome',
    };

    const missingRate = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...baseListing, monthlyPrice: 700 }),
    });
    assert.equal(missingRate.status, 400);
    assert.deepEqual(await missingRate.json(), { error: 'Enter a valid daily rate' });

    const tooManyPhoneDigits = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...baseListing,
        phone: '902-555-01001',
        dailyRate: 25.5,
      }),
    });
    assert.equal(tooManyPhoneDigits.status, 400);
    assert.deepEqual(await tooManyPhoneDigits.json(), {
      error: 'Phone number must not exceed 10 digits',
    });

    const unconfirmedRate = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...baseListing, dailyRate: 25.5, dailyRateAttestationConfirmed: false }),
    });
    assert.equal(unconfirmedRate.status, 400);
    assert.deepEqual(await unconfirmedRate.json(), { error: 'Confirm the daily rate attestation' });

    const unconfirmedProviderStatus = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...baseListing,
        dailyRate: 25.5,
        providerStatusAttestationConfirmed: false,
      }),
    });
    assert.equal(unconfirmedProviderStatus.status, 400);
    assert.deepEqual(await unconfirmedProviderStatus.json(), {
      error: 'Confirm the provider status attestation',
    });

    const withDailyRate = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...baseListing, dailyRate: 25.5, monthlyPrice: 700 }),
    });
    const savedDaycare = await withDailyRate.json();

    assert.equal(withDailyRate.status, 201);
    assert.equal(savedDaycare.dailyRate, 25.5);
    assert.equal(savedDaycare.monthlyPrice, undefined);
    assert.equal(savedDaycare.licensed, false);
    assert.equal(savedDaycare.unlicensedHomeProvider, true);
    assert.equal(savedDaycare.providerCapacityAttestations, undefined);

    for (const providerType of ['licensedCentre', 'regulatedFamilyHome']) {
      const missingStatusConfirmation = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...baseListing,
          dailyRate: 25.5,
          providerType,
          providerStatusAttestationConfirmed: false,
        }),
      });
      assert.equal(missingStatusConfirmation.status, 400);
      assert.deepEqual(await missingStatusConfirmation.json(), {
        error: 'Confirm the provider status attestation',
      });
    }

    const overCapacity = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...baseListing,
        dailyRate: 25.5,
        providerType: 'unlicensedHome',
        maxChildren: 7,
        ageRange: ['infant', 'toddler'],
      }),
    });
    assert.equal(overCapacity.status, 400);
    assert.deepEqual(await overCapacity.json(), {
      error: 'The maximum capacity for this provider type and age range is 6',
    });

    const regulatedFamilyOverCapacity = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...baseListing,
        dailyRate: 25.5,
        providerType: 'regulatedFamilyHome',
        maxChildren: 8,
      }),
    });
    assert.equal(regulatedFamilyOverCapacity.status, 400);
    assert.deepEqual(await regulatedFamilyOverCapacity.json(), {
      error: 'The maximum capacity for this provider type and age range is 7',
    });

    const licensedCentreCapacity = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...baseListing,
        dailyRate: 25.5,
        providerType: 'licensedCentre',
        maxChildren: 24,
      }),
    });
    assert.equal(licensedCentreCapacity.status, 201);
    assert.equal((await licensedCentreCapacity.json()).licensed, true);

    const schoolAgeOverCapacity = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...baseListing,
        dailyRate: 25.5,
        providerType: 'unlicensedHome',
        maxChildren: 8,
        ageRange: ['school-age'],
      }),
    });
    assert.equal(schoolAgeOverCapacity.status, 400);
    assert.deepEqual(await schoolAgeOverCapacity.json(), {
      error: 'The maximum capacity for this provider type and age range is 6',
    });

    const schoolAgeAtCapacity = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...baseListing,
        dailyRate: 25.5,
        providerType: 'unlicensedHome',
        maxChildren: 6,
        ageRange: ['school-age'],
      }),
    });
    assert.equal(schoolAgeAtCapacity.status, 201);

    const regulatedFamilySchoolAgeOverCapacity = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...baseListing,
        dailyRate: 25.5,
        providerType: 'regulatedFamilyHome',
        maxChildren: 8,
        ageRange: ['school-age'],
      }),
    });
    assert.equal(regulatedFamilySchoolAgeOverCapacity.status, 400);
    assert.deepEqual(await regulatedFamilySchoolAgeOverCapacity.json(), {
      error: 'The maximum capacity for this provider type and age range is 7',
    });

    const regulatedFamilySchoolAgeAtCapacity = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...baseListing,
        dailyRate: 25.5,
        providerType: 'regulatedFamilyHome',
        maxChildren: 7,
        ageRange: ['school-age'],
      }),
    });
    assert.equal(regulatedFamilySchoolAgeAtCapacity.status, 201);
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});
