const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const validateObjectId = require('../middleware/validateObjectId');
const { authMiddleware } = require('../middleware/authMiddleware');

// ---------------------------------------------------------------------------
// Optional auth: attach req.user if a valid token is present, but don't block
// ---------------------------------------------------------------------------
function optionalAuth(req, res, next) {
  authMiddleware(req, res, (err) => {
    // Swallow auth errors — req.user just stays undefined
    next();
  });
}

// ---------------------------------------------------------------------------
// GET /api/users/:id/listings
// • Owner (authenticated + id matches):  returns ALL statuses
// • Everyone else:                       returns only 'active' listings
// ---------------------------------------------------------------------------
router.get('/:id/listings', optionalAuth, validateObjectId('id'), async (req, res, next) => {
  try {
    const isOwner = req.user && req.user.id === req.params.id;

    const filter = { seller: req.params.id };
    if (!isOwner) {
      filter.status = 'active';
    }

    const listings = await Listing.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    res.json(listings);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PUT /api/users/profile  —  update the authenticated user's profile
// ---------------------------------------------------------------------------
router.put('/profile', authMiddleware, async (req, res, next) => {
  try {
    const { name, phone, location } = req.body;

    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (phone !== undefined) update.phone = phone.trim();
    if (location !== undefined) update.location = location.trim();

    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
      runValidators: true,
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
