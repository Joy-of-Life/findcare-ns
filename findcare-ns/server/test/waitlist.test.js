const assert = require('node:assert/strict');
const { test } = require('node:test');
const Waitlist = require('../models/Waitlist');

const requiredReferences = {
  daycare: '000000000000000000000001',
  parent: '000000000000000000000002',
};

test('waitlist model accepts all five supported age groups', async () => {
  for (const ageGroup of ['infant', 'toddler', 'preschool', 'kindergarten', 'school-age']) {
    const entry = new Waitlist({ ...requiredReferences, ageGroup });
    await assert.doesNotReject(entry.validate(), `${ageGroup} should be accepted`);
  }
});

test('waitlist model rejects unsupported age groups', async () => {
  const entry = new Waitlist({ ...requiredReferences, ageGroup: 'teenager' });
  await assert.rejects(entry.validate(), error =>
    error.name === 'ValidationError' && Boolean(error.errors.ageGroup)
  );
});
