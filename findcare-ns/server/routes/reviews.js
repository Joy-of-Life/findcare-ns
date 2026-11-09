const express = require('express');
const router  = express.Router();
const Review  = require('../models/Review');
const Daycare = require('../models/Daycare');
const auth    = require('../middleware/auth');

// GET /api/reviews/:daycareId — get all ratings for a daycare
router.get('/:daycareId', async (req, res) => {
  try {
    const reviews = await Review.find({ daycare: req.params.daycareId })
      .select('-text')
      .populate('parent', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reviews/:daycareId — submit a star rating (parent only)
router.post('/:daycareId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Only parents can submit ratings' });
    }

    const { rating } = req.body || {};

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({ error: 'Rating must be a whole number between 1 and 5' });
    }

    // Check if already reviewed
    const existing = await Review.findOne({
      daycare: req.params.daycareId,
      parent:  req.user.id
    });
    if (existing) {
      return res.status(400).json({ error: 'You have already rated this daycare' });
    }

    // Save rating
    const review = new Review({
      daycare:  req.params.daycareId,
      parent:   req.user.id,
      rating,
      verified: true
    });
    await review.save();

    // Update daycare average rating
    const allReviews = await Review.find({ daycare: req.params.daycareId });
    const avgRating  = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await Daycare.findByIdAndUpdate(req.params.daycareId, {
      rating:      Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length
    });

    const populated = await review.populate('parent', 'name');
    res.status(201).json(populated);

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'You have already rated this daycare' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reviews/:id — ratings are immutable; contact support for changes
router.delete('/:id', auth, async (req, res) => {
  res.status(403).json({
    error: 'Ratings cannot be changed or deleted. Contact support@findcarens.com to request an update.'
  });
});

module.exports = router;