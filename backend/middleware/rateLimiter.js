const rateLimit = require('express-rate-limit');

// Strict rate limiter for authentication routes (login/signup) to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes'
  }
});

// Moderate rate limiter for sending messages to prevent spam flooding
const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 message requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many messages sent, please slow down'
  }
});

// Baseline rate limiter across all API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later'
  }
});

module.exports = {
  authLimiter,
  messageLimiter,
  apiLimiter
};
