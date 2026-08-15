const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Listing = require('../models/Listing');

router.post('/', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Signature verification requires the exact raw request body Buffer/string
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
    const isValid = Razorpay.validateWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.warn('Razorpay webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : req.body;
    const event = payload.event;

    console.log(`Razorpay webhook received event: ${event}`);

    if (event === 'qr_code.credited' || event === 'payment.captured') {
      const qrEntity = payload.payload?.qr_code?.entity;
      const paymentEntity = payload.payload?.payment?.entity;

      const qrCodeId = qrEntity?.id || paymentEntity?.description?.match(/order ([\w]+)/)?.[1];
      const orderIdFromNotes = paymentEntity?.notes?.orderId;
      const paymentAmount = paymentEntity?.amount; // paise
      const paymentId = paymentEntity?.id;

      // Find order by razorpay qrCodeId or orderId notes
      let order = null;
      if (qrCodeId) {
        order = await Order.findOne({ 'razorpay.qrCodeId': qrCodeId });
      }
      if (!order && orderIdFromNotes) {
        order = await Order.findById(orderIdFromNotes);
      }

      if (!order) {
        console.warn(`Razorpay webhook: Order not found for QR ${qrCodeId} / Order ${orderIdFromNotes}`);
        return res.status(200).json({ status: 'ignored', reason: 'Order not found' });
      }

      // 1. Idempotency check
      if (order.paymentStatus === 'paid') {
        console.log(`Order ${order._id} already marked paid. Skipping.`);
        return res.status(200).json({ status: 'ok', message: 'Already processed' });
      }

      // 2. Amount check
      const expectedAmount = Math.round(order.totalAmount * 100);
      if (paymentAmount && paymentAmount !== expectedAmount) {
        console.error(
          `Razorpay webhook ANOMALY: Order ${order._id} expected amount ${expectedAmount} paise, received ${paymentAmount} paise.`
        );
        order.needsReview = true;
        await order.save();
        return res.status(200).json({ status: 'amount_mismatch' });
      }

      // 3. Late payment edge case check
      if (order.paymentStatus === 'expired' || order.status === 'cancelled') {
        console.error(
          `Razorpay webhook ANOMALY: Late payment received for expired/cancelled order ${order._id}. Manual review needed.`
        );
        order.needsReview = true;
        order.razorpay.paymentId = paymentId;
        await order.save();
        return res.status(200).json({ status: 'late_payment_flagged' });
      }

      // 4. Normal success: mark paid & confirmed, set listings to sold
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      if (paymentId) {
        order.razorpay.paymentId = paymentId;
      }
      await order.save();

      const listingIds = order.items.map((item) => item.listing);
      await Listing.updateMany(
        { _id: { $in: listingIds } },
        { $set: { status: 'sold', reservedUntil: null } }
      );

      console.log(`Order ${order._id} successfully marked as paid & confirmed.`);
      return res.status(200).json({ status: 'ok' });
    }

    // Unhandled event types respond 200 OK
    return res.status(200).json({ status: 'ignored', event });
  } catch (err) {
    console.error('Error handling Razorpay webhook:', err);
    return res.status(500).json({ error: 'Webhook processing error' });
  }
});

module.exports = router;
