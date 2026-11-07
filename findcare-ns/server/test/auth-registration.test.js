const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const express = require('express');
const User = require('../models/User');
const authRoutes = require('../routes/auth');

const originalFindOne = User.findOne;
const originalSave = User.prototype.save;
const originalFetch = global.fetch;
const originalEnv = {
  CLIENT_URL: process.env.CLIENT_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
};

afterEach(() => {
  User.findOne = originalFindOne;
  User.prototype.save = originalSave;
  global.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

async function requestRegistration(body) {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  try {
    return await fetch(`http://127.0.0.1:${server.address().port}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
}

const parentRegistration = {
  name: 'Test Parent',
  email: 'parent@example.com',
  password: 'password123',
  role: 'parent',
};

test('parent registration requires exactly 10 digits without formatting', async () => {
  for (const phone of [undefined, '', '902555010', '90255501001', '902-555-0100', '+19025550100']) {
    const response = await requestRegistration({ ...parentRegistration, phone });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: 'Enter a mobile number with exactly 10 digits and no spaces or punctuation',
    });
  }
});

test('parent phone is saved and owner registration does not require one', async () => {
  process.env.CLIENT_URL = 'http://localhost:3000';
  process.env.RESEND_API_KEY = 'test-key';
  process.env.RESEND_FROM_EMAIL = 'test@example.com';
  global.fetch = async (url, options) => {
    if (url === 'https://api.resend.com/emails') return new Response('{}', { status: 200 });
    return originalFetch(url, options);
  };

  const savedUsers = [];
  User.findOne = async () => null;
  User.prototype.save = async function save() {
    await this.validate();
    savedUsers.push(this);
    return this;
  };

  const parentResponse = await requestRegistration({ ...parentRegistration, phone: '9025550100' });
  assert.equal(parentResponse.status, 201);
  assert.equal(savedUsers[0].phone, '9025550100');

  const ownerResponse = await requestRegistration({
    name: 'Test Owner',
    email: 'owner@example.com',
    password: 'password123',
    role: 'owner',
  });
  assert.equal(ownerResponse.status, 201);
  assert.equal(savedUsers[1].phone, undefined);
});
