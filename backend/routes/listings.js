const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const { authMiddleware } = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');

// ---------------------------------------------------------------------------
// GET /api/listings — list active listings with filters & pagination
// ---------------------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const {
      category,
      location,
      minPrice,
      maxPrice,
      q,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { status: 'active' };

    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Text search stub — simple regex on title + description for now.
    // Will be replaced with MongoDB Atlas text search in Phase 5.
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate('category', 'name slug')
        .populate('seller', 'name avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Listing.countDocuments(filter),
    ]);

    res.json({
      listings,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/listings/:id — single listing detail
// ---------------------------------------------------------------------------
router.get('/:id', validateObjectId('id'), async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('seller', 'name avatarUrl');

    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    res.json(listing);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/listings — create a listing (protected)
// ---------------------------------------------------------------------------
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { title, description, price, category, condition, images, location } =
      req.body;

    // Manual validation for clearer error messages
    const missing = [];
    if (!title) missing.push('title');
    if (!description) missing.push('description');
    if (price == null) missing.push('price');
    if (!category) missing.push('category');
    if (missing.length) {
      return res
        .status(400)
        .json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    // seller is ALWAYS set from the authenticated user — never from the client
    const listing = await Listing.create({
      title,
      description,
      price,
      category,
      condition,
      images,
      location,
      seller: req.user.id,
    });

    res.status(201).json(listing);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PUT /api/listings/:id — update a listing (protected, owner-only)
// ---------------------------------------------------------------------------
router.put('/:id', authMiddleware, validateObjectId('id'), async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    // Only the owning seller can update
    if (listing.seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own listings' });
    }

    // Whitelist updatable fields (never allow seller override)
    const allowed = ['title', 'description', 'price', 'category', 'condition', 'images', 'location', 'status'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // Validate that key fields aren't being blanked out
    if (updates.title !== undefined && !updates.title) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }
    if (updates.description !== undefined && !updates.description) {
      return res.status(400).json({ error: 'Description cannot be empty' });
    }

    const updated = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('category', 'name slug')
      .populate('seller', 'name avatarUrl');

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/listings/:id — soft delete (protected, owner-only)
// ---------------------------------------------------------------------------
router.delete('/:id', authMiddleware, validateObjectId('id'), async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    if (listing.seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own listings' });
    }

    listing.status = 'removed';
    await listing.save();

    res.json({ message: 'Listing removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
