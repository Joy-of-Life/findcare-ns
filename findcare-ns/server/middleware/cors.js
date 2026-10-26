const cors = require('cors');

const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...configuredOrigins,
  'https://findcarens.com',
  'https://www.findcarens.com',
  'https://findcare-ns.vercel.app',
  'https://findcare-ns-rose.vercel.app',
  'http://localhost:3000',
];

module.exports = cors({
  origin: [...new Set(allowedOrigins)],
  credentials: true,
});
