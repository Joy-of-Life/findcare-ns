const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authRoutes = require('../routes/auth');

const originalFindOne = User.findOne;
const originalFindOneAndUpdate = User.findOneAndUpdate;
const originalFindById = User.findById;
const originalFetch = global.fetch;
const originalSave = User.prototype.save;
const originalEnv = {
  CLIENT_URL: process.env.CLIENT_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
};

afterEach(() => {
  User.findOne = originalFindOne;
  User.findOneAndUpdate = originalFindOneAndUpdate;
  User.findById = originalFindById;
  User.prototype.save = originalSave;
  global.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

async function request(path, body, { method = 'POST', token } = {}) {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return await fetch(`http://127.0.0.1:${server.address().port}/api/auth${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
}

test('forgot password responds identically for existing and unknown emails', async () => {
  process.env.CLIENT_URL = 'http://localhost:3000';
  process.env.RESEND_API_KEY = 'test-key';
  process.env.RESEND_FROM_EMAIL = 'test@example.com';
  const user = {
    email: 'parent@example.com',
    name: 'Test Parent',
    save: async () => user,
  };
  const sentEmails = [];
  User.findOne = async ({ email }) => email === user.email ? user : null;
  global.fetch = async (url, options) => {
    if (url === 'https://api.resend.com/emails') {
      sentEmails.push(JSON.parse(options.body));
      return new Response('{}', { status: 200 });
    }
    return originalFetch(url, options);
  };

  const existingResponse = await request('/forgot-password', { email: ' PARENT@example.com ' });
  const existingData = await existingResponse.json();
  await request('/forgot-password', { email: 'parent@example.com' });
  const unknownResponse = await request('/forgot-password', { email: 'unknown@example.com' });
  const unknownData = await unknownResponse.json();
  const rawTokens = sentEmails.map(email =>
    email.html.match(/reset-password\?token=([a-f\d]{64})/i)?.[1]
  );

  assert.equal(existingResponse.status, 200);
  assert.equal(unknownResponse.status, 200);
  assert.deepEqual(existingData, unknownData);
  assert.match(existingData.message, /If an account exists/);
  assert.equal(rawTokens.length, 2);
  assert.ok(rawTokens.every(Boolean));
  assert.notEqual(rawTokens[0], rawTokens[1]);
  assert.equal(user.passwordResetToken, crypto.createHash('sha256').update(rawTokens[1]).digest('hex'));
  assert.ok(user.passwordResetExpiresAt.getTime() > Date.now() + 59 * 60 * 1000);
});

test('password reset validates tokens and password length, then consumes the token', async () => {
  const rawToken = 'd'.repeat(64);
  const user = {
    password: 'old-hash',
    authVersion: 4,
    passwordResetToken: crypto.createHash('sha256').update(rawToken).digest('hex'),
    passwordResetExpiresAt: new Date(Date.now() + 60_000),
  };
  User.findOneAndUpdate = async (filter, update) => {
    if (user.passwordResetToken !== filter.passwordResetToken ||
        user.passwordResetExpiresAt <= filter.passwordResetExpiresAt.$gt) return null;
    user.password = update.$set.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    user.authVersion += update.$inc.authVersion;
    return user;
  };

  const shortPasswordResponse = await request('/reset-password', { token: rawToken, password: '12345' });
  assert.equal(shortPasswordResponse.status, 400);
  assert.match((await shortPasswordResponse.json()).error, /at least 6 characters/);
  assert.equal(user.authVersion, 4);

  const response = await request('/reset-password', { token: rawToken, password: 'new-password' });
  assert.equal(response.status, 200);
  assert.equal(user.authVersion, 5);
  assert.equal(user.passwordResetToken, undefined);
  assert.equal(user.passwordResetExpiresAt, undefined);
  assert.ok(await bcrypt.compare('new-password', user.password));

  const reusedResponse = await request('/reset-password', { token: rawToken, password: 'another-password' });
  assert.equal(reusedResponse.status, 400);
});

test('expired and malformed password reset tokens are rejected', async () => {
  const rawToken = 'e'.repeat(64);
  const user = {
    passwordResetToken: crypto.createHash('sha256').update(rawToken).digest('hex'),
    passwordResetExpiresAt: new Date(Date.now() - 1000),
    authVersion: 0,
    save: async () => user,
  };
  User.findOneAndUpdate = async (filter, update) => {
    if (user.passwordResetToken !== filter.passwordResetToken ||
        user.passwordResetExpiresAt <= filter.passwordResetExpiresAt.$gt) return null;
    user.password = update.$set.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    user.authVersion += update.$inc.authVersion;
    return user;
  };

  const expiredResponse = await request('/reset-password', { token: rawToken, password: 'new-password' });
  const malformedResponse = await request('/reset-password', { token: 'not-a-token', password: 'new-password' });
  assert.equal(expiredResponse.status, 400);
  assert.match((await expiredResponse.json()).error, /invalid or expired/i);
  assert.equal(malformedResponse.status, 400);
});

test('password reset invalidates previously issued JWT sessions', async () => {
  process.env.JWT_SECRET = 'password-reset-session-test-secret';
  const rawToken = 'f'.repeat(64);
  const user = {
    _id: '000000000000000000000001',
    password: 'old-hash',
    authVersion: 0,
    passwordResetToken: crypto.createHash('sha256').update(rawToken).digest('hex'),
    passwordResetExpiresAt: new Date(Date.now() + 60_000),
    save: async () => user,
  };
  User.findOneAndUpdate = async (filter, update) => {
    if (user.passwordResetToken !== filter.passwordResetToken ||
        user.passwordResetExpiresAt <= filter.passwordResetExpiresAt.$gt) return null;
    user.password = update.$set.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    user.authVersion += update.$inc.authVersion;
    return user;
  };
  User.findById = () => ({ select: async () => user });
  const oldToken = jwt.sign({
    id: user._id,
    role: 'parent',
    authVersion: user.authVersion,
  }, process.env.JWT_SECRET);

  const resetResponse = await request('/reset-password', {
    token: rawToken,
    password: 'new-password',
  });
  assert.equal(resetResponse.status, 200);

  const protectedResponse = await request('/me', undefined, {
    method: 'GET',
    token: oldToken,
  });
  assert.equal(protectedResponse.status, 401);
});

test('login signs the current authentication version into JWTs', async () => {
  process.env.JWT_SECRET = 'password-reset-login-test-secret';
  const password = 'correct-password';
  const user = {
    _id: '000000000000000000000002',
    name: 'Test Parent',
    email: 'parent@example.com',
    role: 'parent',
    verified: true,
    authVersion: 3,
    password: await bcrypt.hash(password, 4),
  };
  User.findOne = () => ({ select: async () => user });

  const response = await request('/login', { email: user.email, password });
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(jwt.verify(data.token, process.env.JWT_SECRET).authVersion, 3);
});
