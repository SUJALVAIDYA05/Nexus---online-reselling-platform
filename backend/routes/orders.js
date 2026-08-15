const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const { authMiddleware } = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const validateObjectId = require('../middleware/validateObjectId');
const { checkAndExpireOrder } = require('../utils/orderCleanup');

// 5% platform guarantee fee — must match the frontend PLATFORM_FEE_RATE
const PLATFORM_FEE_RATE = 0.05;
const QR_EXPIRY_MINUTES = 10;

// Helper to generate a fallback mock QR code image URL
function generateMockQrUrl(totalAmount, orderId) {
  const upiUrl = `upi://pay?pa=nexusmarket@upi&pn=NexusMarketplace&am=${totalAmount}&tn=Order_${orderId}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
}

// ---------------------------------------------------------------------------
// POST /api/orders — create an order (protected, buyer/admin only)
// ---------------------------------------------------------------------------
router.post('/', authMiddleware, requireRole('buyer', 'admin'), async (req, res, next) => {
  try {
    let { items, shippingAddress, paymentMethod } = req.body;

    // Backward compatibility mapping if frontend sends 'upi'
    if (paymentMethod === 'upi') {
      paymentMethod = 'upi_qr';
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }
    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return res.status(400).json({ error: 'Shipping address is required' });
    }
    if (!paymentMethod || !['upi_qr', 'cod'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Payment method must be "upi_qr" or "cod"' });
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

    const formattedAddress = {
      fullName: shippingAddress.fullName || null,
      phone: shippingAddress.phone || null,
      pincode: shippingAddress.pincode || null,
      addressLine: shippingAddress.addressLine || null,
      city: shippingAddress.city || null,
      state: shippingAddress.state || null,
    };

    if (paymentMethod === 'cod') {
      const order = await Order.create({
        buyer: buyerId,
        items: orderItems,
        subtotal,
        platformFee,
        totalAmount,
        shippingAddress: formattedAddress,
        paymentMethod: 'cod',
        paymentStatus: 'not_applicable',
        status: 'pending',
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

      return res.status(201).json(created);
    }

    // paymentMethod === 'upi_qr'
    const expiresAt = new Date(Date.now() + QR_EXPIRY_MINUTES * 60 * 1000);
    const closeBy = Math.floor(expiresAt.getTime() / 1000);

    // Reserve listings immediately for 10 minutes
    await Listing.updateMany(
      { _id: { $in: listingIds } },
      { $set: { status: 'reserved', reservedUntil: expiresAt } }
    );

    const order = await Order.create({
      buyer: buyerId,
      items: orderItems,
      subtotal,
      platformFee,
      totalAmount,
      shippingAddress: formattedAddress,
      paymentMethod: 'upi_qr',
      paymentStatus: 'pending',
      status: 'pending',
      razorpay: {
        expiresAt,
      },
    });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isPlaceholderKey =
      !keyId ||
      keyId.includes('placeholder') ||
      keyId.includes('your-') ||
      !keySecret ||
      keySecret.includes('placeholder');

    if (isPlaceholderKey) {
      console.log(`[Razorpay] Using Demo/Mock QR Code for Order ${order._id} (placeholder keys detected in .env)`);
      order.razorpay.qrCodeId = `qr_dev_${order._id}`;
      order.razorpay.qrImageUrl = generateMockQrUrl(totalAmount, order._id);
      order.razorpay.expiresAt = expiresAt;
      await order.save();
    } else {
      try {
        const razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        const qr = await razorpay.qrCode.create({
          type: 'upi_qr',
          name: `Nexus Order ${order._id}`,
          usage: 'single_use',
          fixed_amount: true,
          payment_amount: Math.round(totalAmount * 100), // paise, integer
          description: `Payment for order ${order._id}`,
          close_by: closeBy, // unix seconds
          notes: { orderId: order._id.toString() },
        });

        order.razorpay.qrCodeId = qr.id;
        order.razorpay.qrImageUrl = qr.image_url;
        if (qr.close_by) {
          order.razorpay.expiresAt = new Date(qr.close_by * 1000);
        }
        await order.save();
      } catch (qrErr) {
        console.error('Razorpay API Error:', qrErr.message || qrErr);

        // In non-production environments, fallback to mock QR code if API fails (e.g. invalid credentials)
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[Razorpay] Falling back to Demo/Mock QR Code for Order ${order._id} due to API error.`);
          order.razorpay.qrCodeId = `qr_dev_${order._id}`;
          order.razorpay.qrImageUrl = generateMockQrUrl(totalAmount, order._id);
          order.razorpay.expiresAt = expiresAt;
          await order.save();
        } else {
          // Revert reservation
          await Listing.updateMany(
            { _id: { $in: listingIds } },
            { $set: { status: 'active', reservedUntil: null } }
          );
          order.paymentStatus = 'failed';
          order.status = 'cancelled';
          await order.save();

          return res.status(502).json({
            error: 'Failed to generate payment QR code from Razorpay. Please verify API keys or try Cash on Delivery.',
            details: qrErr.message,
          });
        }
      }
    }

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
// GET /api/orders/:id/payment-status — payment status polling (buyer or admin)
// ---------------------------------------------------------------------------
router.get('/:id/payment-status', authMiddleware, validateObjectId('id'), async (req, res, next) => {
  try {
    let order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const userId = req.user.id;
    const isBuyer = order.buyer.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to view this order' });
    }

    order = await checkAndExpireOrder(order);

    res.json({
      paymentStatus: order.paymentStatus,
      status: order.status,
      razorpay: {
        expiresAt: order.razorpay?.expiresAt || null,
        qrImageUrl: order.razorpay?.qrImageUrl || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/orders/:id/simulate-payment — admin helper to confirm payment
// ---------------------------------------------------------------------------
router.post('/:id/simulate-payment', authMiddleware, requireRole('admin'), validateObjectId('id'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.paymentStatus === 'paid') {
      return res.json({ message: 'Order already paid', order });
    }

    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.razorpay.paymentId = `pay_simulated_${Date.now()}`;
    await order.save();

    const listingIds = order.items.map((i) => i.listing);
    await Listing.updateMany(
      { _id: { $in: listingIds } },
      { $set: { status: 'sold', reservedUntil: null } }
    );

    res.json({ message: 'Payment simulated successfully', order });
  } catch (err) {
    next(err);
  }
});


// ---------------------------------------------------------------------------
// GET /api/orders/:id — single order (buyer, item seller, or admin)
// ---------------------------------------------------------------------------
router.get('/:id', authMiddleware, validateObjectId('id'), async (req, res, next) => {
  try {
    let order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const userId = req.user.id;
    const isBuyer = order.buyer.toString() === userId;
    const isSeller = order.items.some((i) => i.seller.toString() === userId);
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to view this order' });
    }

    order = await checkAndExpireOrder(order);

    const populated = await Order.findById(order._id)
      .populate('buyer', 'name email avatarUrl')
      .populate('items.listing', 'title images price status')
      .populate('items.seller', 'name avatarUrl');

    res.json(populated);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PUT /api/orders/:id/status — update order status (seller/admin only)
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
