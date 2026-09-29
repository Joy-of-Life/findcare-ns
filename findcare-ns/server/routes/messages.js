const express  = require('express');
const router   = express.Router();
const Message  = require('../models/Message');
const Daycare  = require('../models/Daycare');
const User     = require('../models/User');
const mongoose = require('mongoose');
const auth     = require('../middleware/auth');

const messageFields = [
  { path: 'from', select: 'name role' },
  { path: 'to', select: 'name role' },
  { path: 'daycare', select: 'name' }
];

// GET /api/messages/contacts?daycareId=... — parents who have saved this owner's daycare
router.get('/contacts', auth, async (req, res) => {
  try {
    const { daycareId } = req.query;
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only daycare owners can view saved-parent contacts' });
    }
    if (!mongoose.isValidObjectId(daycareId)) {
      return res.status(400).json({ error: 'A valid daycare is required' });
    }

    const daycare = await Daycare.findOne({ _id: daycareId, owner: req.user.id });
    if (!daycare) {
      return res.status(404).json({ error: 'Daycare not found for this owner' });
    }

    const contacts = await User.find({
      role: 'parent',
      $or: [
        { savedDaycares: daycare._id },
        { savedDaycareHistory: daycare._id }
      ]
    }).select('name');

    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages — get all messages for current user
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ from: req.user.id }, { to: req.user.id }]
    })
    .populate(messageFields)
    .sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages — send a message
router.post('/', auth, async (req, res) => {
  try {
    const { to, daycareId, text, replyTo } = req.body;
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    if (text.length > 2000) {
      return res.status(400).json({ error: 'Message must be 2000 characters or fewer' });
    }

    if (replyTo) {
      if (!mongoose.isValidObjectId(replyTo)) {
        return res.status(400).json({ error: 'Invalid message ID' });
      }
      const original = await Message.findById(replyTo);
      if (!original) {
        return res.status(404).json({ error: 'Message not found' });
      }
      const currentUserId = req.user.id;
      const isSender = original.from.toString() === currentUserId;
      const isRecipient = original.to.toString() === currentUserId;
      if (!isSender && !isRecipient) {
        return res.status(403).json({ error: 'You are not part of this conversation' });
      }

      const reply = new Message({
        from: currentUserId,
        to: isSender ? original.to : original.from,
        daycare: original.daycare,
        text: text.trim()
      });
      await reply.save();
      const populatedReply = await Message.findById(reply._id).populate(messageFields);
      return res.status(201).json(populatedReply);
    }

    if (!to || !daycareId) {
      return res.status(400).json({ error: 'Daycare and recipient are required' });
    }

    if (!mongoose.isValidObjectId(to) || !mongoose.isValidObjectId(daycareId)) {
      return res.status(400).json({ error: 'Invalid daycare or recipient' });
    }

    const daycare = await Daycare.findById(daycareId);
    if (!daycare) {
      return res.status(404).json({ error: 'Daycare not found' });
    }

    if (req.user.role === 'owner') {
      if (daycare.owner.toString() !== req.user.id) {
        return res.status(403).json({ error: 'You can only message parents about your daycare' });
      }
      const parent = await User.findOne({
        _id: to,
        role: 'parent',
        $or: [
          { savedDaycares: daycare._id },
          { savedDaycareHistory: daycare._id }
        ]
      });
      if (!parent) {
        return res.status(403).json({ error: 'This parent has not saved your daycare' });
      }
    } else if (req.user.role === 'parent') {
      if (daycare.owner.toString() !== to) {
        return res.status(400).json({ error: 'Recipient must own the selected daycare' });
      }
      const hasSavedDaycare = await User.exists({ _id: req.user.id, savedDaycares: daycare._id });
      if (!hasSavedDaycare) {
        return res.status(403).json({ error: 'Save this daycare before contacting its owner' });
      }
    } else {
      return res.status(403).json({ error: 'Only parents and daycare owners can send messages' });
    }

    const message = new Message({
      from:    req.user.id,
      to,
      daycare: daycareId,
      text: text.trim(),
    });
    await message.save();
    const populated = await Message.findById(message._id)
      .populate(messageFields);
    res.status(201).json(populated);
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid message data' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages/:id/reply — reply to a message in its conversation
router.post('/:id/reply', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    if (text.length > 2000) {
      return res.status(400).json({ error: 'Message must be 2000 characters or fewer' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    const original = await Message.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const currentUserId = req.user.id;
    const isSender = original.from.toString() === currentUserId;
    const isRecipient = original.to.toString() === currentUserId;
    if (!isSender && !isRecipient) {
      return res.status(403).json({ error: 'You are not part of this conversation' });
    }

    const reply = new Message({
      from: currentUserId,
      to: isSender ? original.to : original.from,
      daycare: original.daycare,
      text: text.trim()
    });
    await reply.save();
    const populated = await Message.findById(reply._id).populate(messageFields);
    res.status(201).json(populated);
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid message data' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/messages/:id/read — mark message as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }
    const message = await Message.findOneAndUpdate(
      { _id: req.params.id, to: req.user.id },
      { read: true, readAt: new Date() },
      { new: true }
    );
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
