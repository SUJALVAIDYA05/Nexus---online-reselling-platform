const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer is required'],
    },
    items: [
      {
        listing: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Listing',
          required: [true, 'Listing is required'],
        },
        seller: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: [true, 'Seller is required'],
        },
        priceAtPurchase: {
          type: Number,
          required: [true, 'Price at purchase is required'],
        },
        _id: false,
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    platformFee: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      fullName: { type: String, default: null },
      phone: { type: String, default: null },
      pincode: { type: String, default: null },
      addressLine: { type: String, default: null },
      city: { type: String, default: null },
      state: { type: String, default: null },
    },
    paymentMethod: {
      type: String,
      enum: ['upi_qr', 'cod'],
      required: [true, 'Payment method is required'],
    },
    paymentStatus: {
      type: String,
      enum: ['not_applicable', 'pending', 'paid', 'failed', 'expired'],
      default: 'not_applicable',
    },
    razorpay: {
      qrCodeId: { type: String, default: null },
      qrImageUrl: { type: String, default: null },
      paymentId: { type: String, default: null },
      expiresAt: { type: Date, default: null },
    },
    needsReview: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'],
      default: 'pending',
    },

  },
  {
    timestamps: true,
  }
);

// Efficient lookups by buyer (purchases) and item seller (sales)
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ 'items.seller': 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
