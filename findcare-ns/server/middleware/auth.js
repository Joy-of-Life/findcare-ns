const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token
  if (!token) {
    return res.status(401).json({ error: 'No token — access denied' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Token is not valid' });
  }

  try {
    const user = await User.findById(decoded.id).select('+authVersion');
    if (!user || (decoded.authVersion || 0) !== (user.authVersion || 0)) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    req.user = decoded;
    return next();
  } catch (err) {
    console.error('Authentication session check failed:', err);
    return res.status(503).json({ error: 'Authentication is temporarily unavailable' });
  }
};
