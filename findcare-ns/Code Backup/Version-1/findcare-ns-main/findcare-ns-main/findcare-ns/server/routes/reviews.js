const express = require('express');
const router  = express.Router();
const Review  = require('../models/Review');
const Daycare = require('../models/Daycare');
const auth    = require('../middleware/auth');

// GET /api/reviews/:daycareId — get all reviews for a daycare
router.get('/:daycareId', async (req, res) => {
  try {
    const reviews = await Review.find({ daycare: req.params.daycareId })
      .populate('parent', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reviews/:daycareId — submit a review (parent only)
router.post('/:daycareId', auth, async (req, res) => {
  try {
    const { rating, text } = req.body;

    // Validate
    if (!rating || !text) {
      return res.status(400).json({ error: 'Rating and review text are required' });
    }
    if (text.length < 20) {
      return res.status(400).json({ error: 'Review must be at least 20 characters' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if already reviewed
    const existing = await Review.findOne({
      daycare: req.params.daycareId,
      parent:  req.user.id
    });
    if (existing) {
      return res.status(400).json({ error: 'You have already reviewed this daycare' });
    }

    // Save review
    const review = new Review({
      daycare:  req.params.daycareId,
      parent:   req.user.id,
      rating:   Number(rating),
      text,
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
      return res.status(400).json({ error: 'You have already reviewed this daycare' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reviews/:id — delete a review (owner of review only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.parent.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await review.deleteOne();
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;