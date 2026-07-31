const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Listing = require('../models/Listing');
const validateObjectId = require('../middleware/validateObjectId');
const requireRole = require('../middleware/requireRole');
const { authMiddleware } = require('../middleware/authMiddleware');

// ---------------------------------------------------------------------------
// GET /api/users — list all users (admin only), paginated
// ---------------------------------------------------------------------------
router.get('/', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);

    res.json({
      users,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/users/:id/listings
// • Owner (authenticated + id matches):  returns ALL statuses
// • Everyone else:                       returns only 'active' listings
// ---------------------------------------------------------------------------
router.get(
  '/:id/listings',
  (req, res, next) => authMiddleware(req, res, next, { optional: true }),
  validateObjectId('id'),
  async (req, res, next) => {
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
  }
);

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
