const request = require('supertest');
const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Category = require('../models/Category');

process.env.RAZORPAY_KEY_ID = 'rzp_test_mock_key';
process.env.RAZORPAY_KEY_SECRET = 'rzp_test_mock_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret_123';

jest.mock('razorpay', () => {
  const actual = jest.requireActual('razorpay');
  function MockRazorpay() {
    return {
      qrCode: {
        create: async (params) => ({
          id: 'qr_mock_12345',
          image_url: 'https://api.razorpay.com/v1/qr_codes/qr_mock_12345/image',
          close_by: params.close_by || Math.floor((Date.now() + 600000) / 1000),
        }),
      },
    };
  }
  MockRazorpay.validateWebhookSignature = actual.validateWebhookSignature;
  return MockRazorpay;
});

const app = require('../server');

describe('Razorpay UPI QR Payments & Order Expiry', () => {
  let buyerToken, buyerUser, sellerUser, testCategory, testListing;

  beforeEach(async () => {
    // 1. Create seller
    sellerUser = await User.create({
      name: 'Seller User',
      email: 'seller@example.com',
      password: 'password123',
      role: 'seller',
    });

    // 2. Create buyer
    const buyerSignup = await request(app).post('/api/auth/signup').send({
      name: 'Buyer User',
      email: 'buyer@example.com',
      password: 'password123',
      role: 'buyer',
    });
    buyerToken = buyerSignup.body.token;
    buyerUser = buyerSignup.body.user;

    // 3. Create category
    testCategory = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
    });

    // 4. Create listing
    testListing = await Listing.create({
      title: 'Used Smartphone',
      description: 'Great condition phone',
      price: 10000,
      category: testCategory._id,
      condition: 'good',
      images: [{ url: 'https://example.com/img.jpg', publicId: 'img1' }],
      seller: sellerUser._id,
      status: 'active',
    });
  });

  describe('POST /api/orders with paymentMethod="cod"', () => {
    it('should create COD order and mark listing sold immediately', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          items: [testListing._id.toString()],
          shippingAddress: {
            fullName: 'Buyer User',
            phone: '9876543210',
            pincode: '400001',
            addressLine: '123 Main St',
            city: 'Mumbai',
            state: 'Maharashtra',
          },
          paymentMethod: 'cod',
        });

      expect(res.status).toBe(201);
      expect(res.body.paymentMethod).toBe('cod');
      expect(res.body.paymentStatus).toBe('not_applicable');
      expect(res.body.status).toBe('pending');

      const updatedListing = await Listing.findById(testListing._id);
      expect(updatedListing.status).toBe('sold');
    });
  });

  describe('POST /api/orders with paymentMethod="upi_qr"', () => {
    it('should reserve listing and set order paymentStatus to pending', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          items: [testListing._id.toString()],
          shippingAddress: {
            fullName: 'Buyer User',
            phone: '9876543210',
            pincode: '400001',
            addressLine: '123 Main St',
            city: 'Mumbai',
            state: 'Maharashtra',
          },
          paymentMethod: 'upi_qr',
        });

      expect(res.status).toBe(201);
      expect(res.body.paymentMethod).toBe('upi_qr');
      expect(res.body.paymentStatus).toBe('pending');
      expect(res.body.razorpay.qrCodeId).toBe('qr_mock_12345');
      expect(res.body.razorpay.qrImageUrl).toContain('qr_mock_12345');

      // Verify listing is now reserved
      const updatedListing = await Listing.findById(testListing._id);
      expect(updatedListing.status).toBe('reserved');
      expect(updatedListing.reservedUntil).not.toBeNull();

      // Verify reserved listing does NOT appear in GET /api/listings
      const browseRes = await request(app).get('/api/listings');
      expect(browseRes.status).toBe(200);
      const found = browseRes.body.listings.find((l) => l._id === testListing._id.toString());
      expect(found).toBeUndefined();
    });
  });

  describe('GET /api/orders/:id/payment-status & Lazy Expiry', () => {
    it('should expire order and release listing reservation if expiresAt is past', async () => {
      testListing.status = 'reserved';
      testListing.reservedUntil = new Date(Date.now() - 1000);
      await testListing.save();

      const expiredOrder = await Order.create({
        buyer: buyerUser.id,
        items: [{ listing: testListing._id, seller: sellerUser._id, priceAtPurchase: 10000 }],
        subtotal: 10000,
        platformFee: 500,
        totalAmount: 10500,
        shippingAddress: { fullName: 'Buyer' },
        paymentMethod: 'upi_qr',
        paymentStatus: 'pending',
        status: 'pending',
        razorpay: {
          qrCodeId: 'qr_exp_123',
          qrImageUrl: 'https://example.com/qr.png',
          expiresAt: new Date(Date.now() - 5000), // 5s ago
        },
      });

      const res = await request(app)
        .get(`/api/orders/${expiredOrder._id}/payment-status`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.paymentStatus).toBe('expired');
      expect(res.body.status).toBe('cancelled');

      // Check DB: listing should be released back to active
      const listingInDb = await Listing.findById(testListing._id);
      expect(listingInDb.status).toBe('active');
      expect(listingInDb.reservedUntil).toBeNull();
    });
  });

  describe('POST /api/payments/webhook/razorpay', () => {
    let pendingOrder;

    beforeEach(async () => {
      testListing.status = 'reserved';
      await testListing.save();

      pendingOrder = await Order.create({
        buyer: buyerUser.id,
        items: [{ listing: testListing._id, seller: sellerUser._id, priceAtPurchase: 10000 }],
        subtotal: 10000,
        platformFee: 500,
        totalAmount: 10500,
        shippingAddress: { fullName: 'Buyer' },
        paymentMethod: 'upi_qr',
        paymentStatus: 'pending',
        status: 'pending',
        razorpay: {
          qrCodeId: 'qr_webhook_test_1',
          qrImageUrl: 'https://example.com/qr.png',
          expiresAt: new Date(Date.now() + 600000),
        },
      });
    });

    it('should reject webhook with 400 when signature is invalid', async () => {
      const body = JSON.stringify({ event: 'qr_code.credited' });
      const res = await request(app)
        .post('/api/payments/webhook/razorpay')
        .set('x-razorpay-signature', 'invalid_signature')
        .set('Content-Type', 'application/json')
        .send(body);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid signature');
    });

    it('should process qr_code.credited webhook with valid signature and mark order paid & listing sold', async () => {
      const payload = {
        event: 'qr_code.credited',
        payload: {
          qr_code: {
            entity: {
              id: 'qr_webhook_test_1',
            },
          },
          payment: {
            entity: {
              id: 'pay_999888777',
              amount: 1050000, // 10500 INR in paise
            },
          },
        },
      };
      const bodyString = JSON.stringify(payload);

      // Compute valid HMAC signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(bodyString)
        .digest('hex');

      const res = await request(app)
        .post('/api/payments/webhook/razorpay')
        .set('x-razorpay-signature', expectedSignature)
        .set('Content-Type', 'application/json')
        .send(bodyString);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');

      // Check DB order status
      const updatedOrder = await Order.findById(pendingOrder._id);
      expect(updatedOrder.paymentStatus).toBe('paid');
      expect(updatedOrder.status).toBe('confirmed');
      expect(updatedOrder.razorpay.paymentId).toBe('pay_999888777');

      // Check DB listing status
      const updatedListing = await Listing.findById(testListing._id);
      expect(updatedListing.status).toBe('sold');
    });
  });
});
