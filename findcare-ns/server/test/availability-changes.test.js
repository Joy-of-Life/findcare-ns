const assert = require('node:assert/strict');
const { test } = require('node:test');
const getAvailabilityIncreases = require('../services/availabilityChanges');

test('availability count increases include positive changes, not only zero-to-one', () => {
  assert.deepEqual(
    getAvailabilityIncreases(
      { infant: 1, toddler: 2, preschool: 2, kindergarten: 0, 'school-age': 3 },
      { infant: 2, toddler: 4, preschool: 2, kindergarten: 1, 'school-age': 1 }
    ),
    { infant: 2, toddler: 4, kindergarten: 1 }
  );
});
