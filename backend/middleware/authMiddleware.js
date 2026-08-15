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
 * Core auth logic shared by both the required and optional variants.
 * Kept as a plain function (NOT directly used as middleware) so that the
 * exported middleware always has exactly 3 parameters — Express treats
 * any middleware with 4 params as an error handler, which was the cause
 * of the 500 Internal Server Error on protected routes.
 */
async function _authenticate(req, res, next, options) {
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

/**
 * Express middleware — verifies the JWT from an httpOnly cookie or
 * the Authorization header, then attaches the CURRENT user document
 * (including role) to req.user.  Returns 401 if no valid token is found.
 *
 * IMPORTANT: This function intentionally has exactly 3 parameters so
 * Express registers it as regular middleware (not an error handler).
 */
async function authMiddleware(req, res, next) {
  return _authenticate(req, res, next, {});
}

/**
 * Factory that returns an optional auth middleware — if the token is
 * missing or invalid the request continues as anonymous (req.user
 * stays undefined) instead of returning 401.
 *
 * Usage:  router.get('/resource', optionalAuth(), handler);
 */
function optionalAuth() {
  return (req, res, next) => _authenticate(req, res, next, { optional: true });
}

module.exports = { generateToken, authMiddleware, optionalAuth };
