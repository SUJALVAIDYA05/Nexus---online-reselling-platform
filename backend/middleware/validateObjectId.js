const mongoose = require('mongoose');

/**
 * Returns Express middleware that validates req.params[paramName] is a
 * syntactically valid Mongoose ObjectId.  Returns 400 before the query
 * runs so Mongoose never throws an ugly CastError.
 *
 * Usage:
 *   router.get('/:id', validateObjectId('id'), handler);
 */
function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
      return res.status(400).json({ error: `Invalid ${paramName}: ${req.params[paramName]}` });
    }
    next();
  };
}

module.exports = validateObjectId;
