const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Generate a signed JWT for the given user document.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Express middleware — verifies the JWT from an httpOnly cookie or
 * the Authorization header, then attaches the CURRENT user document
 * (including role) to req.user.
 *
 * Pass { optional: true } to treat missing/invalid tokens as anonymous
 * (req.user stays undefined) instead of returning 401.
 */
async function authMiddleware(req, res, next, options = {}) {
  const token =
    req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    if (options.optional) return next();
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Fetch the full user doc so role/account state is always current
    const user = await User.findById(payload.id).lean();
    if (!user) {
      if (options.optional) return next();
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      location: user.location,
      avatarUrl: user.avatarUrl,
    };
    next();
  } catch (err) {
    if (
      err.name === 'JsonWebTokenError' ||
      err.name === 'TokenExpiredError'
    ) {
      if (options.optional) return next();
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    next(err);
  }
}

module.exports = { generateToken, authMiddleware };
