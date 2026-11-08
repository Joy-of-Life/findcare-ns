const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');
const messagesRoutes = require('../routes/messages');

const OWNER_ID = '000000000000000000000001';
const JWT_SECRET = 'messages-unread-count-test-secret';
const originals = {
  countDocuments: Message.countDocuments,
  findById: User.findById,
  jwtSecret: process.env.JWT_SECRET,
};

afterEach(() => {
  Message.countDocuments = originals.countDocuments;
  User.findById = originals.findById;
  if (originals.jwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originals.jwtSecret;
});

async function getUnreadCount({ role, token = true }) {
  process.env.JWT_SECRET = JWT_SECRET;
  User.findById = () => ({ select: async () => ({ authVersion: 0 }) });
  const app = express();
  app.use('/api/messages', messagesRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  try {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${jwt.sign({
      id: OWNER_ID,
      role,
      authVersion: 0,
    }, JWT_SECRET)}`;
    return await fetch(`http://127.0.0.1:${server.address().port}/api/messages/unread-count`, { headers });
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
}

test('owner unread-count returns only unread messages addressed to that owner', async () => {
  let filter;
  Message.countDocuments = async query => {
    filter = query;
    return 3;
  };

  const response = await getUnreadCount({ role: 'owner' });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { count: 3 });
  assert.deepEqual(filter, { to: OWNER_ID, read: false });
});

test('parent and unauthenticated users cannot access the owner unread-count endpoint', async () => {
  let countQueryCalled = false;
  Message.countDocuments = async () => {
    countQueryCalled = true;
    return 0;
  };

  const parentResponse = await getUnreadCount({ role: 'parent' });
  assert.equal(parentResponse.status, 403);
  assert.equal(countQueryCalled, false);

  const anonymousResponse = await getUnreadCount({ role: 'owner', token: false });
  assert.equal(anonymousResponse.status, 401);
});
