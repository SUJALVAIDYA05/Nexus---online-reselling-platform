const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const { authMiddleware } = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const validateObjectId = require('../middleware/validateObjectId');

// 5% platform guarantee fee — must match the frontend PLATFORM_FEE_RATE
const PLATFORM_FEE_RATE = 0.05;

// ---------------------------------------------------------------------------
// POST /api/orders — create an order (protected, buyer/admin only)
// ---------------------------------------------------------------------------
router.post('/', authMiddleware, requireRole('buyer', 'admin'), async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }
    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return res.status(400).json({ error: 'Shipping address is required' });
    }
    if (!paymentMethod || !['upi', 'cod'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Payment method must be "upi" or "cod"' });
    }

    // Deduplicate while preserving order
    const listingIds = [...new Set(items)];
    const invalidIds = listingIds.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ error: 'One or more items have an invalid id' });
    }

    // Server re-fetches each listing — never trust client-sent prices
    const listings = await Listing.find({ _id: { $in: listingIds } });

    const byId = new Map(listings.map((l) => [l._id.toString(), l]));
    const unavailable = [];
    const buyerId = req.user.id;
    const orderItems = [];
    let subtotal = 0;

    for (const id of listingIds) {
      const listing = byId.get(id);
      if (!listing) {
        unavailable.push(id);
        continue;
      }
      if (listing.status !== 'active') {
        unavailable.push(id);
        continue;
      }
      if (listing.seller.toString() === buyerId) {
        return res.status(400).json({
          error: 'You cannot order your own listing',
          listingId: id,
        });
      }
      orderItems.push({
        listing: listing._id,
        seller: listing.seller,
        priceAtPurchase: listing.price,
      });
      subtotal += listing.price;
    }

    if (unavailable.length > 0) {
      return res.status(409).json({
        error: 'Some items are no longer available for purchase',
        unavailable,
      });
    }

    const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE);
    const totalAmount = subtotal + platformFee;

    const order = await Order.create({
      buyer: buyerId,
      items: orderItems,
      subtotal,
      platformFee,
      totalAmount,
      shippingAddress: {
        fullName: shippingAddress.fullName || null,
        phone: shippingAddress.phone || null,
        pincode: shippingAddress.pincode || null,
        addressLine: shippingAddress.addressLine || null,
        city: shippingAddress.city || null,
        state: shippingAddress.state || null,
      },
      paymentMethod,
    });

    // Mark each purchased listing as sold so it leaves active browse/search
    await Listing.updateMany(
      { _id: { $in: listingIds } },
      { $set: { status: 'sold' } }
    );

    const created = await Order.findById(order._id)
      .populate('buyer', 'name email avatarUrl')
      .populate('items.listing', 'title images price')
      .populate('items.seller', 'name avatarUrl');

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/orders — list orders (role-aware)
//   buyer  → their own orders
//   seller → orders containing at least one item they sold
//   admin  → all orders, platform-wide
// ---------------------------------------------------------------------------
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.user.role === 'buyer') {
      filter.buyer = req.user.id;
    } else if (req.user.role === 'seller') {
      filter['items.seller'] = req.user.id;
    }
    // admin sees everything

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('buyer', 'name email avatarUrl')
        .populate('items.listing', 'title images price status')
        .populate('items.seller', 'name avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/orders/:id — single order (buyer, item seller, or admin)
// ---------------------------------------------------------------------------
router.get('/:id', authMiddleware, validateObjectId('id'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email avatarUrl')
      .populate('items.listing', 'title images price status')
      .populate('items.seller', 'name avatarUrl');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const userId = req.user.id;
    const isBuyer = order.buyer._id.toString() === userId;
    const isSeller = order.items.some((i) => i.seller._id.toString() === userId);
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to view this order' });
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PUT /api/orders/:id/status — update order status (seller/admin only)
//   seller → only orders containing their own items
//   admin  → any order
// ---------------------------------------------------------------------------
router.put('/:id/status', authMiddleware, requireRole('seller', 'admin'), validateObjectId('id'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowedStatuses.join(', ')}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Sellers may only update orders that include one of their own items
    if (req.user.role !== 'admin') {
      const hasOwnItem = order.items.some(
        (i) => i.seller.toString() === req.user.id
      );
      if (!hasOwnItem) {
        return res.status(403).json({ error: 'You can only update orders containing your items' });
      }
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
