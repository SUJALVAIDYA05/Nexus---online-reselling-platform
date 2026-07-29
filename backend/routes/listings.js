const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const cloudinary = require('../config/cloudinary');
const { authMiddleware } = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');

// ---------------------------------------------------------------------------
// Helper — delete images from Cloudinary (fire-and-forget)
// ---------------------------------------------------------------------------
function destroyImages(images) {
  if (!images || images.length === 0) return;
  for (const img of images) {
    cloudinary.uploader.destroy(img.publicId).catch((err) => {
      console.error(`Failed to delete Cloudinary image ${img.publicId}:`, err.message);
    });
  }
}

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
      sort,
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

    // Full-text search using MongoDB text index (ranked by relevance).
    // Falls back to regex if text index is unavailable.
    let useTextSearch = false;
    if (q) {
      filter.$text = { $search: q };
      useTextSearch = true;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Determine sort order — text-relevance when searching, else by query param
    let sortOrder;
    if (sort === 'price_asc') {
      sortOrder = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOrder = { price: -1 };
    } else if (useTextSearch) {
      // Relevance sort (default when text search is active)
      sortOrder = { score: { $meta: 'textScore' }, createdAt: -1 };
    } else {
      sortOrder = { createdAt: -1 };
    }

    // Build the query — include textScore projection when doing text search
    let query = Listing.find(filter);
    if (useTextSearch) {
      query = query.select({ score: { $meta: 'textScore' } });
    }

    try {
      const [listings, total] = await Promise.all([
        query
          .populate('category', 'name slug')
          .populate('seller', 'name avatarUrl')
          .sort(sortOrder)
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
    } catch (textErr) {
      // Fallback: if $text fails (no text index yet), use regex search instead
      if (useTextSearch && textErr.code === 27) {
        delete filter.$text;
        filter.$or = [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
        ];
        const fallbackSort = sort === 'price_asc' ? { price: 1 }
          : sort === 'price_desc' ? { price: -1 }
          : { createdAt: -1 };

        const [listings, total] = await Promise.all([
          Listing.find(filter)
            .populate('category', 'name slug')
            .populate('seller', 'name avatarUrl')
            .sort(fallbackSort)
            .skip(skip)
            .limit(limitNum)
            .lean(),
          Listing.countDocuments(filter),
        ]);

        return res.json({
          listings,
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        });
      }
      throw textErr;
    }
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

    // Clean up orphaned images on Cloudinary when images change
    if (updates.images) {
      const newPublicIds = new Set(updates.images.map((img) => img.publicId));
      const removedImages = listing.images.filter(
        (img) => !newPublicIds.has(img.publicId)
      );
      destroyImages(removedImages);
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
// DELETE /api/listings/:id — permanently delete (protected, owner-only)
// ---------------------------------------------------------------------------
router.delete('/:id', authMiddleware, validateObjectId('id'), async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    if (listing.seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own listings' });
    }

    // Clean up images on Cloudinary (fire-and-forget)
    destroyImages(listing.images);

    await Listing.findByIdAndDelete(req.params.id);

    res.json({ message: 'Listing permanently deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
