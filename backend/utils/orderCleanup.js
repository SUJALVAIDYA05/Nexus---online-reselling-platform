const Order = require('../models/Order');
const Listing = require('../models/Listing');

/**
 * Checks if a specific pending order has expired, and if so,
 * cancels it and reverts its reserved listings back to active.
 */
async function checkAndExpireOrder(order) {
  if (!order || order.paymentMethod !== 'upi_qr' || order.paymentStatus !== 'pending') {
    return order;
  }

  if (order.razorpay && order.razorpay.expiresAt && new Date(order.razorpay.expiresAt) < new Date()) {
    order.paymentStatus = 'expired';
    order.status = 'cancelled';
    await order.save();

    const listingIds = order.items.map((item) => item.listing._id || item.listing);
    if (listingIds.length > 0) {
      await Listing.updateMany(
        { _id: { $in: listingIds }, status: 'reserved' },
        { $set: { status: 'active', reservedUntil: null } }
      );
    }
  }

  return order;
}

/**
 * Periodically releases reservations for all expired pending UPI QR orders.
 * Note: In a larger production deployment, this should move to a proper job queue/cron
 * instead of an in-process interval.
 */
async function releaseExpiredReservations() {
  try {
    const expiredOrders = await Order.find({
      paymentMethod: 'upi_qr',
      paymentStatus: 'pending',
      'razorpay.expiresAt': { $lt: new Date() },
    });

    for (const order of expiredOrders) {
      await checkAndExpireOrder(order);
    }
  } catch (err) {
    console.error('Error during releaseExpiredReservations cleanup:', err.message);
  }
}

module.exports = {
  checkAndExpireOrder,
  releaseExpiredReservations,
};
