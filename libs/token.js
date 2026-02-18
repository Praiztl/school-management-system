const jwt = require('jsonwebtoken');

const JWT_SECRET  = process.env.JWT_SECRET  || 'change-me-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

const sign = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

const verify = (token) => jwt.verify(token, JWT_SECRET);

module.exports = { sign, verify };
