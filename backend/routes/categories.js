const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { authMiddleware } = require('../middleware/authMiddleware');

// ---------------------------------------------------------------------------
// GET /api/categories — list all categories (parent populated)
// ---------------------------------------------------------------------------
router.get('/', async (_req, res, next) => {
  try {
    const categories = await Category.find()
      .populate('parent', 'name slug')
      .sort({ name: 1 })
      .lean();

    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/categories — create a category (protected)
// ---------------------------------------------------------------------------
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { name, parent } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Auto-generate slug from name
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const category = await Category.create({
      name: name.trim(),
      slug,
      parent: parent || null,
    });

    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
