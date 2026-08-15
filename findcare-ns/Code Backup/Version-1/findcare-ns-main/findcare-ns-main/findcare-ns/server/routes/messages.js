const express  = require('express');
const router   = express.Router();
const Message  = require('../models/Message');
const auth     = require('../middleware/auth');

// GET /api/messages — get all messages for current user
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ from: req.user.id }, { to: req.user.id }]
    })
    .populate('from',    'name role')
    .populate('to',      'name role')
    .populate('daycare', 'name')
    .sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages — send a message
router.post('/', auth, async (req, res) => {
  try {
    const { to, daycareId, text } = req.body;
    if (!to || !text) {
      return res.status(400).json({ error: 'Recipient and message text are required' });
    }
    const message = new Message({
      from:    req.user.id,
      to,
      daycare: daycareId,
      text,
    });
    await message.save();
    const populated = await Message.findById(message._id)
      .populate('from',    'name role')
      .populate('to',      'name role')
      .populate('daycare', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/messages/:id/read — mark message as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { read: true, readAt: new Date() },
      { new: true }
    );
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
