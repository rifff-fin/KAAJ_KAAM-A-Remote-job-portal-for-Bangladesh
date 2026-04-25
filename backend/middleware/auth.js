// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ message: 'No token, access denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kaaj-kaam-secret-2025');
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid' });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kaaj-kaam-secret-2025');
      req.user = decoded; // { id, role }
    } catch (err) {
      // Invalid token, but continue without user
      req.user = null;
    }
  }
  next();
};

module.exports = { protect, optionalAuth };