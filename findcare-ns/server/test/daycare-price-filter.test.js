const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const Daycare = require('../models/Daycare');
const daycareRoutes = require('../routes/daycares');

const originalFind = Daycare.find;

test.afterEach(() => {
  Daycare.find = originalFind;
});

test('daily price filter queries dailyRate and excludes unconfirmed rates from results', async () => {
  let receivedQuery;
  Daycare.find = async query => {
    receivedQuery = query;
    return [
      { name: 'Under budget', dailyRate: 25 },
      { name: 'Over budget', dailyRate: 35 },
      { name: 'Not confirmed', dailyRate: undefined },
      { name: 'Empty rate', dailyRate: '' },
      { name: 'Invalid rate', dailyRate: -1 },
    ];
  };

  const app = express();
  app.use('/api/daycares', daycareRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares?maxPrice=30`);
    const daycares = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(receivedQuery, { dailyRate: { $lte: 30 } });
    assert.deepEqual(daycares.map(daycare => daycare.name), ['Under budget']);
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});
