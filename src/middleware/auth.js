const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function authenticate(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing token' });
  const token = h.split(' ')[1];
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };
