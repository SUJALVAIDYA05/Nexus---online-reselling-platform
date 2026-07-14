/**
 * Central Express error-handling middleware.
 * Must be registered AFTER all routes (4-argument signature).
 */
function errorHandler(err, _req, res, _next) {
  // Log the full error in development for debugging
  console.error('Error:', err);

  // Mongoose validation error (missing / invalid fields)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(', ') });
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  }

  // MongoDB duplicate-key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern).join(', ');
    return res.status(409).json({ error: `Duplicate value for: ${field}` });
  }

  // Default — unexpected server error
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Internal server error';
  res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;
