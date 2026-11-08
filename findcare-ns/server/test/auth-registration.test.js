const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const crypto = require('node:crypto');
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
  return requestAuth('/register', body);
}

async function requestAuth(path, body) {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  try {
    return await fetch(`http://127.0.0.1:${server.address().port}/api/auth${path}`, {
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

test('registration stores a hashed expiring token and emails the raw link token', async () => {
  process.env.CLIENT_URL = 'http://localhost:3000';
  process.env.RESEND_API_KEY = 'test-key';
  process.env.RESEND_FROM_EMAIL = 'test@example.com';
  let savedUser;
  let sentEmail;
  User.findOne = async () => null;
  User.prototype.save = async function save() {
    await this.validate();
    savedUser = this;
    return this;
  };
  global.fetch = async (url, options) => {
    if (url === 'https://api.resend.com/emails') {
      sentEmail = JSON.parse(options.body);
      return new Response('{}', { status: 200 });
    }
    return originalFetch(url, options);
  };

  const before = Date.now();
  const response = await requestRegistration({
    name: 'Test Owner',
    email: 'OWNER@example.com',
    password: 'password123',
    role: 'owner',
  });
  const data = await response.json();
  const rawToken = sentEmail.html.match(/verify-email\?token=([a-f\d]{64})/i)?.[1];

  assert.equal(response.status, 201);
  assert.equal(data.verificationEmailSent, true);
  assert.equal(savedUser.email, 'owner@example.com');
  assert.match(savedUser.verifyToken, /^[a-f\d]{64}$/i);
  assert.ok(rawToken);
  assert.notEqual(savedUser.verifyToken, rawToken);
  assert.equal(savedUser.verifyToken, crypto.createHash('sha256').update(rawToken).digest('hex'));
  assert.ok(savedUser.verifyTokenExpiresAt.getTime() >= before + 24 * 60 * 60 * 1000 - 1000);
});

test('registration keeps the account recoverable when verification email delivery fails', async () => {
  process.env.CLIENT_URL = 'http://localhost:3000';
  process.env.RESEND_API_KEY = 'test-key';
  process.env.RESEND_FROM_EMAIL = 'test@example.com';
  const originalConsoleError = console.error;
  let savedUser;
  User.findOne = async () => null;
  User.prototype.save = async function save() {
    await this.validate();
    savedUser = this;
    return this;
  };
  global.fetch = async (url, options) => {
    if (url === 'https://api.resend.com/emails') {
      return new Response('provider unavailable', { status: 503 });
    }
    return originalFetch(url, options);
  };
  console.error = () => {};

  try {
    const response = await requestRegistration({
      name: 'Test Parent',
      email: 'parent@example.com',
      password: 'password123',
      role: 'parent',
      phone: '9025550100',
    });
    const data = await response.json();

    assert.equal(response.status, 201);
    assert.equal(data.verificationEmailSent, false);
    assert.match(data.message, /account was created/i);
    assert.equal(savedUser.verified, false);
    assert.ok(savedUser.verifyToken);
    assert.ok(savedUser.verifyTokenExpiresAt > new Date());
  } finally {
    console.error = originalConsoleError;
  }
});

test('registration distinguishes unverified duplicate accounts from verified accounts', async () => {
  User.findOne = async () => ({ verified: false });
  const unverifiedResponse = await requestRegistration({
    ...parentRegistration,
    phone: '9025550100',
  });
  assert.equal(unverifiedResponse.status, 409);
  assert.equal((await unverifiedResponse.json()).code, 'EMAIL_NOT_VERIFIED');

  User.findOne = async () => ({ verified: true });
  const verifiedResponse = await requestRegistration({
    ...parentRegistration,
    phone: '9025550100',
  });
  const verifiedData = await verifiedResponse.json();
  assert.equal(verifiedResponse.status, 409);
  assert.equal(verifiedData.code, 'EMAIL_ALREADY_VERIFIED');
  assert.match(verifiedData.error, /try to Log in/i);
});

test('resending verification replaces the stored token and emails a new one', async () => {
  process.env.CLIENT_URL = 'http://localhost:3000';
  process.env.RESEND_API_KEY = 'test-key';
  process.env.RESEND_FROM_EMAIL = 'test@example.com';
  const originalToken = 'a'.repeat(64);
  const user = {
    email: 'parent@example.com',
    name: 'Test Parent',
    verified: false,
    verifyToken: crypto.createHash('sha256').update(originalToken).digest('hex'),
    save: async () => user,
  };
  let sentEmail;
  User.findOne = async () => user;
  global.fetch = async (url, options) => {
    if (url === 'https://api.resend.com/emails') {
      sentEmail = JSON.parse(options.body);
      return new Response('{}', { status: 200 });
    }
    return originalFetch(url, options);
  };

  const response = await requestAuth('/resend-verification', { email: ' PARENT@example.com ' });
  const data = await response.json();
  const rawToken = sentEmail.html.match(/verify-email\?token=([a-f\d]{64})/i)?.[1];

  assert.equal(response.status, 200);
  assert.match(data.message, /If an unverified account exists/);
  assert.ok(rawToken);
  assert.notEqual(user.verifyToken, crypto.createHash('sha256').update(originalToken).digest('hex'));
  assert.equal(user.verifyToken, crypto.createHash('sha256').update(rawToken).digest('hex'));
  assert.ok(user.verifyTokenExpiresAt > new Date());
});

test('verification accepts a current token and rejects an expired one', async () => {
  const token = 'b'.repeat(64);
  const user = {
    verifyToken: crypto.createHash('sha256').update(token).digest('hex'),
    verifyTokenExpiresAt: new Date(Date.now() + 60_000),
    verified: false,
    save: async () => user,
  };
  User.findOne = () => ({ select: async () => user });

  const validResponse = await requestAuth('/verify-email', { token });
  assert.equal(validResponse.status, 200);
  assert.equal(user.verified, true);
  assert.equal(user.verifyToken, undefined);
  assert.equal(user.verifyTokenExpiresAt, undefined);

  user.verified = false;
  user.verifyToken = crypto.createHash('sha256').update(token).digest('hex');
  user.verifyTokenExpiresAt = new Date(Date.now() - 1000);
  const expiredResponse = await requestAuth('/verify-email', { token });
  assert.equal(expiredResponse.status, 400);
  assert.match((await expiredResponse.json()).error, /expired.*request a new verification link/i);
  assert.equal(user.verified, false);
});

test('verification accepts recent legacy tokens and rejects legacy tokens older than 24 hours', async () => {
  const token = 'c'.repeat(64);
  const user = {
    verifyToken: token,
    verifyTokenExpiresAt: undefined,
    createdAt: new Date(Date.now() - 60_000),
    verified: false,
    save: async () => user,
  };
  User.findOne = () => ({ select: async () => user });

  const recentResponse = await requestAuth('/verify-email', { token });
  assert.equal(recentResponse.status, 200);

  user.verified = false;
  user.verifyToken = token;
  user.createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
  const expiredResponse = await requestAuth('/verify-email', { token });
  assert.equal(expiredResponse.status, 400);
  assert.match((await expiredResponse.json()).error, /expired/i);
});
