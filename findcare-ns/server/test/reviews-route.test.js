const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Daycare = require('../models/Daycare');
const User = require('../models/User');
const reviewRoutes = require('../routes/reviews');

const originalEnvSecret = process.env.JWT_SECRET;
const originalReviewFind = Review.find;
const originalReviewFindOne = Review.findOne;
const originalReviewFindById = Review.findById;
const originalReviewSave = Review.prototype.save;
const originalReviewPopulate = Review.prototype.populate;
const originalReviewDeleteOne = Review.prototype.deleteOne;
const originalDaycareUpdate = Daycare.findByIdAndUpdate;
const originalUserFindById = User.findById;

afterEach(() => {
  if (originalEnvSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalEnvSecret;
  Review.find = originalReviewFind;
  Review.findOne = originalReviewFindOne;
  Review.findById = originalReviewFindById;
  Review.prototype.save = originalReviewSave;
  Review.prototype.populate = originalReviewPopulate;
  Review.prototype.deleteOne = originalReviewDeleteOne;
  Daycare.findByIdAndUpdate = originalDaycareUpdate;
  User.findById = originalUserFindById;
});

async function request(method, path, { role = 'parent', body, authenticated = true } = {}) {
  process.env.JWT_SECRET = 'test-secret';
  User.findById = () => ({
    select: async () => ({ authVersion: 0 }),
  });

  const app = express();
  app.use(express.json());
  app.use('/api/reviews', reviewRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (authenticated) {
      const token = jwt.sign(
        { id: new mongoose.Types.ObjectId().toString(), role, authVersion: 0 },
        process.env.JWT_SECRET
      );
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/reviews${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { response, data: await response.json() };
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
}

test('review listing omits stored legacy comments', async () => {
  let selectedFields;
  Review.find = () => {
    const query = {
      select(fields) {
        selectedFields = fields;
        return this;
      },
      populate() { return this; },
      sort() { return this; },
      then(resolve, reject) {
        const rows = [{ _id: 'review-1', rating: 4, text: 'Legacy comment', parent: { name: 'Parent' } }]
          .map(({ text, ...review }) => review);
        return Promise.resolve(rows).then(resolve, reject);
      },
    };
    return query;
  };

  const { response, data } = await request('GET', '/daycare-1', { authenticated: false });

  assert.equal(response.status, 200);
  assert.equal(selectedFields, '-text');
  assert.equal(data[0].text, undefined);
  assert.equal(data[0].rating, 4);
});

test('a parent can submit a star-only rating and the daycare aggregate updates', async () => {
  let savedReview;
  let aggregateUpdate;
  Review.findOne = async () => null;
  Review.prototype.save = async function save() {
    savedReview = this;
    return this;
  };
  Review.prototype.populate = async function populate() {
    return this;
  };
  Review.find = async () => [{ rating: 3 }, savedReview];
  Daycare.findByIdAndUpdate = async (id, update) => {
    aggregateUpdate = { id, update };
  };

  const { response, data } = await request('POST', '/daycare-1', {
    body: { rating: 4, text: 'This comment must not be stored' },
  });

  assert.equal(response.status, 201);
  assert.equal(savedReview.rating, 4);
  assert.equal(savedReview.text, undefined);
  assert.equal(data.text, undefined);
  assert.equal(aggregateUpdate.update.rating, 3.5);
  assert.equal(aggregateUpdate.update.reviewCount, 2);
});

test('only parents can submit a rating', async () => {
  const { response, data } = await request('POST', '/daycare-1', {
    role: 'owner',
    body: { rating: 4 },
  });

  assert.equal(response.status, 403);
  assert.equal(data.error, 'Only parents can submit ratings');
});

test('a parent cannot submit a second rating for the same daycare', async () => {
  Review.findOne = async () => ({ _id: 'existing-rating' });

  const { response, data } = await request('POST', '/daycare-1', {
    body: { rating: 5 },
  });

  assert.equal(response.status, 400);
  assert.equal(data.error, 'You have already rated this daycare');
});

test('only parents can delete ratings', async () => {
  const { response, data } = await request('DELETE', '/rating-1', { role: 'owner' });

  assert.equal(response.status, 403);
  assert.equal(data.error, 'Only parents can delete ratings');
});

test('ratings must be whole stars from one through five', async () => {
  for (const rating of [0, 5.5, 6, '', '3', true]) {
    const { response } = await request('POST', '/daycare-1', {
      body: { rating },
    });
    assert.equal(response.status, 400, `expected rating ${JSON.stringify(rating)} to be rejected`);
  }
});

test('deleting a rating recalculates the daycare aggregate', async () => {
  const daycareId = new mongoose.Types.ObjectId();
  const review = {
    _id: new mongoose.Types.ObjectId(),
    daycare: daycareId,
    parent: { toString: () => 'parent-1' },
    deleteOne: async () => {},
  };
  let aggregateUpdate;
  Review.findById = async () => review;
  Review.find = async () => [{ rating: 3 }, { rating: 5 }];
  Daycare.findByIdAndUpdate = async (id, update) => {
    aggregateUpdate = { id, update };
  };

  process.env.JWT_SECRET = 'test-secret';
  User.findById = () => ({ select: async () => ({ authVersion: 0 }) });
  const app = express();
  app.use('/api/reviews', reviewRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  try {
    const token = jwt.sign({ id: 'parent-1', role: 'parent', authVersion: 0 }, process.env.JWT_SECRET);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/reviews/${review._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(response.status, 200);
    assert.equal(aggregateUpdate.id, daycareId);
    assert.deepEqual(aggregateUpdate.update, { rating: 4, reviewCount: 2 });
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});
