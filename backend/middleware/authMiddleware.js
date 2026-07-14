const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Generate a signed JWT for the given user document.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Express middleware — verifies the JWT from an httpOnly cookie or
 * the Authorization header and attaches the decoded payload to req.user.
 */
function authMiddleware(req, res, next) {
  const token =
    req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { generateToken, authMiddleware };
