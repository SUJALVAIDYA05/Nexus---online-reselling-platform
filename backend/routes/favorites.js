const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Favorite = require('../models/Favorite');
const Listing = require('../models/Listing');
const { authMiddleware } = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');

// All favorites routes are protected
router.use(authMiddleware);

// ---------------------------------------------------------------------------
// POST /api/favorites — add a listing to favorites
// ---------------------------------------------------------------------------
router.post('/', async (req, res, next) => {
  try {
    const { listingId } = req.body;

    if (!listingId || !mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ error: 'Valid listingId is required' });
    }

    // Verify the listing exists and is active
    const listing = await Listing.findById(listingId);
    if (!listing || listing.status !== 'active') {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const favorite = await Favorite.create({
      user: req.user.id,
      listing: listingId,
    });

    res.status(201).json(favorite);
  } catch (err) {
    // Handle duplicate favorite gracefully
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Listing is already in your favorites' });
    }
    next(err);
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/favorites/:listingId — remove from favorites
// ---------------------------------------------------------------------------
router.delete('/:listingId', validateObjectId('listingId'), async (req, res, next) => {
  try {
    const result = await Favorite.findOneAndDelete({
      user: req.user.id,
      listing: req.params.listingId,
    });

    if (!result) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/favorites — list current user's favorites (populated)
// ---------------------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id })
      .populate({
        path: 'listing',
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'seller', select: 'name avatarUrl' },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json(favorites);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
