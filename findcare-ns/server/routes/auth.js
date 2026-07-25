const express   = require('express');
const router    = express.Router();
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const crypto    = require('crypto');
const nodemailer = require('nodemailer');
const User      = require('../models/User');
const auth      = require('../middleware/auth');

// ─── Email transporter ────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// ─── REGISTER ─────────────────────────────────────────────────
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check all fields present
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check role is valid
    if (!['parent', 'owner'].includes(role)) {
      return res.status(400).json({ error: 'Role must be parent or owner' });
    }

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt     = await bcrypt.genSalt(12);
    const hashed   = await bcrypt.hash(password, salt);

    // Generate verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = new User({
      name,
      email,
      password:    hashed,
      role,
      verifyToken
    });
    await user.save();

    // Send verification email
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verifyToken}`;
    await transporter.sendMail({
      from:    process.env.GMAIL_USER,
      to:      email,
      subject: 'Welcome to FindCare NS — Please verify your email',
      html: `
        <h2>Welcome to FindCare NS, ${name}!</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verifyUrl}" style="background:#1D9E75;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
          Verify Email
        </a>
        <p>This link expires in 24 hours.</p>
        <p>If you did not create an account, please ignore this email.</p>
      `
    });

    res.status(201).json({
      message: 'Account created! Please check your email to verify your account.'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── VERIFY EMAIL ─────────────────────────────────────────────
// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({ verifyToken: token });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification link' });
    }

    user.verified    = true;
    user.verifyToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully! You can now log in.' });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check fields present
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check email verified
    if (!user.verified) {
      return res.status(400).json({ error: 'Please verify your email before logging in' });
    }

    // Check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Issue JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET CURRENT USER ─────────────────────────────────────────
// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -verifyToken');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;