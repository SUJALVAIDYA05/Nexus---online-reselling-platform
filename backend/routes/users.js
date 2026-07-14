const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const validateObjectId = require('../middleware/validateObjectId');

// ---------------------------------------------------------------------------
// GET /api/users/:id/listings — all active listings by a specific seller
// ---------------------------------------------------------------------------
router.get('/:id/listings', validateObjectId('id'), async (req, res, next) => {
  try {
    const listings = await Listing.find({
      seller: req.params.id,
      status: 'active',
    })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    res.json(listings);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
