const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');
const daycareRoutes = require('../routes/daycares');

test('daycare creation and edits require licensing-status attestation', async () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'licensing-attestation-test-secret';
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
      body: JSON.stringify({ licensed: false }),
    });
    assert.equal(createResponse.status, 400);
    assert.deepEqual(await createResponse.json(), {
      error: 'Confirm the licensing status attestation',
    });

    const editResponse = await fetch(`${baseUrl}/000000000000000000000001`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ name: 'Updated daycare' }),
    });
    assert.equal(editResponse.status, 400);
    assert.deepEqual(await editResponse.json(), {
      error: 'Confirm the licensing status attestation',
    });
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  }
});
