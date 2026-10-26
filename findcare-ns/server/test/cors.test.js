const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const corsMiddleware = require('../middleware/cors');

test('CORS allows custom and legacy Vercel frontend origins', async () => {
  const app = express();
  app.use(corsMiddleware);
  app.get('/api/daycares/:id', (req, res) => res.json({ id: req.params.id }));
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  try {
    for (const origin of [
      'https://findcarens.com',
      'https://www.findcarens.com',
      'https://findcare-ns.vercel.app',
      'https://findcare-ns-rose.vercel.app',
    ]) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares/test-id`, {
        method: 'OPTIONS',
        headers: {
          Origin: origin,
          'Access-Control-Request-Method': 'GET',
        },
      });
      assert.equal(response.status, 204);
      assert.equal(response.headers.get('access-control-allow-origin'), origin);
      assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
    }
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});

test('CORS does not allow unrelated frontend origins', async () => {
  const app = express();
  app.use(corsMiddleware);
  app.get('/api/daycares/:id', (req, res) => res.json({ id: req.params.id }));
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/daycares/test-id`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://unrelated.example',
        'Access-Control-Request-Method': 'GET',
      },
    });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});
