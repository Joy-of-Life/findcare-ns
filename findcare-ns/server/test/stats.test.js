const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const User = require('../models/User');
const Daycare = require('../models/Daycare');
const statsRoutes = require('../routes/stats');

test('stats endpoint reports total and licensed daycare counts separately', async () => {
  const originalUserCountDocuments = User.countDocuments;
  const originalDaycareCountDocuments = Daycare.countDocuments;
  const daycareQueries = [];

  User.countDocuments = async filter => {
    assert.deepEqual(filter, { role: 'parent' });
    return 17;
  };
  Daycare.countDocuments = async filter => {
    daycareQueries.push(filter);
    return filter ? 8 : 12;
  };

  const app = express();
  app.use('/api/stats', statsRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/stats`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), {
      familiesConnected: 17,
      licensedDaycares: 8,
      totalDaycares: 12,
    });
    assert.deepEqual(daycareQueries, [{ licensed: true }, undefined]);
  } finally {
    User.countDocuments = originalUserCountDocuments;
    Daycare.countDocuments = originalDaycareCountDocuments;
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});
