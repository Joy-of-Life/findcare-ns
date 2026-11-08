const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const daycareRoutes = require('../routes/daycares');

test('daycare creation and edits require provider capacity attestation', async () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalUserFindById = User.findById;
  process.env.JWT_SECRET = 'licensing-attestation-test-secret';
  User.findById = () => ({ select: async () => ({ authVersion: 0 }) });
  const app = express();
  app.use(express.json());
  app.use('/api/daycares', daycareRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  try {
    const token = jwt.sign({ id: '000000000000000000000001' }, process.env.JWT_SECRET);
    const baseUrl = `http://127.0.0.1:${server.address().port}/api/daycares`;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const createResponse = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dailyRateAttestationConfirmed: true,
        providerType: 'licensedCentre',
        capacityAttestationConfirmed: false,
      }),
    });
    assert.equal(createResponse.status, 400);
    assert.deepEqual(await createResponse.json(), {
      error: 'Confirm the provider capacity attestation',
    });

    const missingStatusResponse = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dailyRateAttestationConfirmed: true,
        providerType: 'licensedCentre',
        capacityAttestationConfirmed: true,
        providerStatusAttestationConfirmed: false,
      }),
    });
    assert.equal(missingStatusResponse.status, 400);
    assert.deepEqual(await missingStatusResponse.json(), {
      error: 'Confirm the provider status attestation',
    });

    const editResponse = await fetch(`${baseUrl}/000000000000000000000001`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        dailyRateAttestationConfirmed: true,
        capacityAttestationConfirmed: false,
      }),
    });
    assert.equal(editResponse.status, 400);
    assert.deepEqual(await editResponse.json(), {
      error: 'Confirm the provider capacity attestation',
    });

    const missingEditStatusResponse = await fetch(`${baseUrl}/000000000000000000000001`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        dailyRateAttestationConfirmed: true,
        capacityAttestationConfirmed: true,
        providerStatusAttestationConfirmed: false,
      }),
    });
    assert.equal(missingEditStatusResponse.status, 400);
    assert.deepEqual(await missingEditStatusResponse.json(), {
      error: 'Confirm the provider status attestation',
    });
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
    User.findById = originalUserFindById;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  }
});
