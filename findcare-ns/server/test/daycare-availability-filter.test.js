const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const Daycare = require('../models/Daycare');
const SUPPORTED_AGE_GROUPS = require('../constants/ageGroups');
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

test('Open vacancy status without an age group matches openings in any supported category', async () => {
  let receivedQuery;
  Daycare.find = async query => {
    receivedQuery = query;
    return [];
  };

  await requestListings('?availabilityStatus=open');

  assert.deepEqual(receivedQuery, {
    $and: [{
      $or: SUPPORTED_AGE_GROUPS.map(group => ({
        [`availability.${group}`]: { $gt: 0 },
      })),
    }],
  });
});

test('Open vacancy status with an age group matches openings in that category', async () => {
  let receivedQuery;
  Daycare.find = async query => {
    receivedQuery = query;
    return [];
  };

  await requestListings('?availabilityStatus=open&ageRange=infant');

  assert.deepEqual(receivedQuery, {
    ageRange: { $in: ['infant'] },
    $and: [{
      'availability.infant': { $gt: 0 },
    }],
  });
});

test('Waitlist status without an age group excludes daycares with openings in any category', async () => {
  let receivedQuery;
  Daycare.find = async query => {
    receivedQuery = query;
    return [];
  };

  await requestListings('?availabilityStatus=waitlist');

  assert.deepEqual(receivedQuery, {
    $and: [{
      $nor: SUPPORTED_AGE_GROUPS.map(group => ({
        [`availability.${group}`]: { $gt: 0 },
      })),
    }],
  });
});

test('Waitlist status with an age group matches daycares without openings for that category', async () => {
  let receivedQuery;
  Daycare.find = async query => {
    receivedQuery = query;
    return [];
  };

  await requestListings('?availabilityStatus=waitlist&ageRange=infant');

  assert.deepEqual(receivedQuery, {
    ageRange: { $in: ['infant'] },
    $and: [{
      $nor: [{ 'availability.infant': { $gt: 0 } }],
    }],
  });
});
