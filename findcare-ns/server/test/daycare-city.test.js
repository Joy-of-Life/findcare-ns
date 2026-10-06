const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const Daycare = require('../models/Daycare');
const NOVA_SCOTIA_CITIES = require('../constants/novaScotiaCities');
const seedDaycares = require('../data/daycares.json');
const daycareRoutes = require('../routes/daycares');

test('seeded daycare cities are all supported Nova Scotia communities', () => {
  const allowedCities = new Set(NOVA_SCOTIA_CITIES);
  const unsupportedCities = [...new Set(seedDaycares.map(daycare => daycare.city))]
    .filter(city => !allowedCities.has(city));

  assert.deepEqual(unsupportedCities, []);
});

test('daycare model accepts a supported Nova Scotia city', async () => {
  const daycare = new Daycare({
    owner: '000000000000000000000001',
    name: 'Test daycare',
    address: '1 Main Street',
    city: 'Halifax',
  });

  await assert.doesNotReject(daycare.validate());
});

test('daycare model rejects a city outside Nova Scotia', async () => {
  const daycare = new Daycare({
    owner: '000000000000000000000001',
    name: 'Test daycare',
    address: '1 Main Street',
    city: 'Toronto',
  });

  await assert.rejects(daycare.validate(), error =>
    error.name === 'ValidationError' && /Nova Scotia/.test(error.errors.city.message)
  );
});

test('cities endpoint is matched before the daycare ID route', async () => {
  const app = express();
  app.use('/api/daycares', daycareRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares/cities`);
    const cities = await response.json();
    assert.equal(response.status, 200);
    assert.ok(cities.includes('Halifax'));
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});

test('invalid daycare IDs return 400 instead of a Mongoose cast error', async () => {
  const app = express();
  app.use('/api/daycares', daycareRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares/not-an-object-id`);
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.error, 'Invalid daycare ID');
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});
