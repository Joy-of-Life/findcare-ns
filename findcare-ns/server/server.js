const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const { rateLimit } = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts — please try again in 15 minutes' }
});
app.use('/api/auth', authLimiter);

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/daycares', require('./routes/daycares'));
app.use('/api/reviews',  require('./routes/reviews'));
app.use('/api/waitlist', require('./routes/waitlist'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/alerts',   require('./routes/alerts'));
app.use('/api/ai',       require('./routes/ai'));

// Health check
app.get('/', (req, res) => {
  res.json({
    status:   'FindCare API is running',
    version:  '1.0',
    province: 'Nova Scotia, Canada'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected — findcaredb'))
  .catch(err => console.log('MongoDB error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`FindCare API running on port ${PORT}`);
});
