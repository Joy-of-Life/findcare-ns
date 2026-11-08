const express   = require('express');
const router    = express.Router();
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const crypto    = require('crypto');
const mongoose  = require('mongoose');
const { rateLimit } = require('express-rate-limit');
const User      = require('../models/User');
const auth      = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const passwordResetRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many password reset requests. Please try again in 15 minutes.' },
});
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many password reset attempts. Please try again in 15 minutes.' },
});
const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many verification requests. Please try again in 15 minutes.' },
});

function createVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    hash: crypto.createHash('sha256').update(token).digest('hex'),
    expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
  };
}

function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    hash: crypto.createHash('sha256').update(token).digest('hex'),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
  };
}

async function sendVerificationEmail(user, token) {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Welcome to FindCare NS — Please verify your email',
    html: `
      <h2>Welcome to FindCare NS, ${user.name}!</h2>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verifyUrl}" style="background:#1D9E75;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
    `,
  });
}

async function sendPasswordResetEmail(user, token) {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your FindCare NS password',
    html: `
      <h2>Password reset request</h2>
      <p>We received a request to reset the password for this account.</p>
      <p>Use the link below to choose a new password. This link expires in one hour and can only be used once.</p>
      <a href="${resetUrl}" style="background:#1D9E75;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
        Reset password
      </a>
      <p>If you did not request a password reset, you can ignore this email. Your password will not change.</p>
    `,
  });
}

// ─── REGISTER ─────────────────────────────────────────────────
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check all fields present
    if (!name || typeof email !== 'string' || !email.trim() || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check role is valid
    if (!['parent', 'owner'].includes(role)) {
      return res.status(400).json({ error: 'Role must be parent or owner' });
    }
    if (role === 'parent' && (typeof phone !== 'string' || !/^\d{10}$/.test(phone))) {
      return res.status(400).json({ error: 'Enter a mobile number with exactly 10 digits and no spaces or punctuation' });
    }

    // Check if email already exists
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      if (!existing.verified) {
        return res.status(409).json({
          code: 'EMAIL_NOT_VERIFIED',
          error: 'Email already registered but not verified. Please verify your email or request a new verification link.',
        });
      }
      return res.status(409).json({
        code: 'EMAIL_ALREADY_VERIFIED',
        error: 'Email already registered - please try to Log in.',
      });
    }

    // Hash password
    const salt     = await bcrypt.genSalt(12);
    const hashed   = await bcrypt.hash(password, salt);

    const verification = createVerificationToken();

    // Create user
    const user = new User({
      name,
      email: normalizedEmail,
      ...(role === 'parent' ? { phone } : {}),
      password:    hashed,
      role,
      verifyToken: verification.hash,
      verifyTokenExpiresAt: verification.expiresAt,
    });
    await user.save();

    try {
      await sendVerificationEmail(user, verification.token);
    } catch (err) {
      console.error('Registration verification email failed:', err);
      return res.status(201).json({
        message: 'Your account was created, but we couldn’t send the verification email. Please request a new verification link.',
        verificationEmailSent: false,
      });
    }

    res.status(201).json({
      message: 'Account created! Please check your email to verify your account.',
      verificationEmailSent: true,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', resendVerificationLimiter, async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
    const genericResponse = {
      message: 'If an unverified account exists for this email, a new verification link will be sent.',
    };

    if (!email) return res.json(genericResponse);

    const user = await User.findOne({ email });
    if (!user || user.verified) return res.json(genericResponse);

    const verification = createVerificationToken();
    user.verifyToken = verification.hash;
    user.verifyTokenExpiresAt = verification.expiresAt;
    await user.save();

    try {
      await sendVerificationEmail(user, verification.token);
    } catch (err) {
      console.error('Verification resend email failed:', err);
    }

    return res.json(genericResponse);
  } catch (err) {
    console.error('Verification resend failed:', err);
    return res.status(500).json({ error: 'Unable to process the request right now. Please try again.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', passwordResetRequestLimiter, async (req, res) => {
  const genericResponse = {
    message: 'If an account exists for this email, we’ll send password reset instructions.',
  };

  try {
    const email = typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
    if (!email) return res.json(genericResponse);

    const user = await User.findOne({ email });
    if (!user) return res.json(genericResponse);

    const reset = createPasswordResetToken();
    user.passwordResetToken = reset.hash;
    user.passwordResetExpiresAt = reset.expiresAt;
    await user.save();

    try {
      await sendPasswordResetEmail(user, reset.token);
    } catch (err) {
      console.error('Password reset email failed:', err);
    }

    return res.json(genericResponse);
  } catch (err) {
    console.error('Password reset request failed:', err);
    return res.status(500).json({ error: 'Unable to process the request right now. Please try again.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (typeof token !== 'string' || !/^[a-f\d]{64}$/i.test(token)) {
      return res.status(400).json({ error: 'This password reset link is invalid or expired. Request a new one to continue.' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.findOneAndUpdate(
      {
        passwordResetToken: tokenHash,
        passwordResetExpiresAt: { $gt: new Date() },
      },
      {
        $set: { password: hashedPassword },
        $unset: { passwordResetToken: 1, passwordResetExpiresAt: 1 },
        $inc: { authVersion: 1 },
      },
      { new: true, runValidators: true },
    );
    if (!user) {
      return res.status(400).json({ error: 'This password reset link is invalid or expired. Request a new one to continue.' });
    }

    return res.json({ message: 'Your password has been reset. Please log in with your new password.' });
  } catch (err) {
    console.error('Password reset failed:', err);
    return res.status(500).json({ error: 'Unable to reset your password right now. Please try again.' });
  }
});

// ─── VERIFY EMAIL ─────────────────────────────────────────────
// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (typeof token !== 'string' || !/^[a-f\d]{64}$/i.test(token)) {
      return res.status(400).json({ error: 'Invalid or expired verification link. Request a new verification link to try again.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      verifyToken: { $in: [tokenHash, token] },
    }).select('+verifyToken +verifyTokenExpiresAt');
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification link. Request a new verification link to try again.' });
    }

    const legacyToken = user.verifyToken === token;
    const expiry = user.verifyTokenExpiresAt ||
      (legacyToken && user.createdAt
        ? new Date(user.createdAt.getTime() + VERIFICATION_TOKEN_TTL_MS)
        : null);
    if (user.verified || !expiry || expiry <= new Date()) {
      return res.status(400).json({ error: 'This verification link has expired. Request a new verification link to try again.' });
    }

    user.verified    = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiresAt = undefined;
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
    const user = await User.findOne({ email }).select('+authVersion');
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
      { id: user._id, role: user.role, name: user.name, authVersion: user.authVersion || 0 },
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

// PATCH /api/auth/save-daycare
router.patch('/save-daycare', auth, async (req, res) => {
  try {
    // Only parents can save daycares
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Only parents can save daycares' });
    }

    const { daycareId } = req.body;
    if (!daycareId || !mongoose.isValidObjectId(daycareId)) {
      return res.status(400).json({ error: 'A valid daycare is required' });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isSaved = user.savedDaycares.some(id => id.toString() === daycareId);
    if (!user.savedDaycareHistory.some(id => id.toString() === daycareId)) {
      user.savedDaycareHistory.push(daycareId);
    }

    if (isSaved) {
      user.savedDaycares = user.savedDaycares.filter(
        id => id.toString() !== daycareId
      );
    } else {
      user.savedDaycares.push(daycareId);
    }

    await user.save();
    res.json({
      saved:         !isSaved,
      savedDaycares: user.savedDaycares
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;