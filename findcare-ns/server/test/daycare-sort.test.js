const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const Daycare = require('../models/Daycare');
const daycareRoutes = require('../routes/daycares');

const originalFind = Daycare.find;

test.afterEach(() => {
  Daycare.find = originalFind;
});

async function requestListings(query) {
  const app = express();
  app.use('/api/daycares', daycareRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares${query}`);
    assert.equal(response.status, 200);
    return response.json();
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
}

test('browse distance ordering uses only distance and keeps listings without coordinates last', async () => {
  Daycare.find = async () => [
    { name: 'Far Star', rating: 5, coordinates: { lat: 45, lng: -63.58 } },
    { name: 'Near Zebra', rating: 4, coordinates: { lat: 44.651, lng: -63.58 } },
    { name: 'Near Alpha', rating: 4, coordinates: { lat: 44.651, lng: -63.58 } },
    { name: 'Near Top Rated', rating: 5, coordinates: { lat: 44.651, lng: -63.58 } },
    { name: 'No Location', rating: 5 },
    { name: 'No Location A', rating: 1 },
  ];

  const daycares = await requestListings('?sortByDistance=true&lat=44.65&lng=-63.58');

  assert.deepEqual(daycares.map(daycare => daycare.name), [
    'Near Zebra',
    'Near Alpha',
    'Near Top Rated',
    'Far Star',
    'No Location',
    'No Location A',
  ]);
  assert.equal(daycares[0].distanceFromUser, 0.1);
  assert.equal(daycares[4].distanceFromUser, null);
});

test('browse ordering falls back to rating descending, then name ascending without location', async () => {
  Daycare.find = async () => [
    { name: 'B Centre', rating: 4 },
    { name: 'C Centre', rating: 5 },
    { name: 'A Centre', rating: 4 },
  ];

  const daycares = await requestListings('');

  assert.deepEqual(daycares.map(daycare => daycare.name), [
    'C Centre',
    'A Centre',
    'B Centre',
  ]);
});
