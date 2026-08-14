const request = require('supertest');
const app = require('../server');
const Category = require('../models/Category');
const Listing = require('../models/Listing');

describe('Listings Endpoints', () => {
  let sellerToken;
  let sellerUser;
  let buyerToken;
  let categoryDoc;

  beforeEach(async () => {
    // Create Category
    categoryDoc = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
    });

    // Create Seller
    const sellerRes = await request(app).post('/api/auth/signup').send({
      name: 'Seller User',
      email: 'seller@example.com',
      password: 'password123',
      role: 'seller',
    });
    sellerToken = sellerRes.body.token;
    sellerUser = sellerRes.body.user;

    // Create Buyer
    const buyerRes = await request(app).post('/api/auth/signup').send({
      name: 'Buyer User',
      email: 'buyer@example.com',
      password: 'password123',
      role: 'buyer',
    });
    buyerToken = buyerRes.body.token;
  });

  describe('POST /api/listings', () => {
    it('should return 401 when creating a listing without a token', async () => {
      const res = await request(app).post('/api/listings').send({
        title: 'Smartphone',
        description: 'Brand new smartphone',
        price: 500,
        category: categoryDoc._id,
      });

      expect(res.status).toBe(401);
    });

    it('should create listing and return 201 with valid data and seller token', async () => {
      const listingData = {
        title: 'Smartphone',
        description: 'Brand new smartphone in box',
        price: 500,
        category: categoryDoc._id.toString(),
        condition: 'new',
      };

      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(listingData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.title).toBe(listingData.title);
      expect(res.body.price).toBe(500);
      expect(res.body.seller).toBe(sellerUser.id);
    });

    it('should normalize image objects missing publicId when creating a listing', async () => {
      const listingData = {
        title: 'Laptop with images',
        description: 'Great laptop for work',
        price: 800,
        category: categoryDoc._id.toString(),
        condition: 'like-new',
        images: [{ url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' }],
      };

      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(listingData);

      expect(res.status).toBe(201);
      expect(res.body.images).toHaveLength(1);
      expect(res.body.images[0].url).toBe(listingData.images[0].url);
      expect(res.body.images[0]).toHaveProperty('publicId');
      expect(res.body.images[0].publicId).toBeTruthy();
    });
  });

  describe('GET /api/listings', () => {
    let furnitureCategory;

    beforeEach(async () => {
      furnitureCategory = await Category.create({
        name: 'Furniture',
        slug: 'furniture',
      });

      await Listing.create([
        {
          title: 'Gaming Laptop',
          description: 'High performance laptop',
          price: 1200,
          category: categoryDoc._id,
          seller: sellerUser.id,
          status: 'active',
        },
        {
          title: 'Budget Phone',
          description: 'Cheap smartphone',
          price: 150,
          category: categoryDoc._id,
          seller: sellerUser.id,
          status: 'active',
        },
        {
          title: 'Wooden Chair',
          description: 'Comfortable chair',
          price: 80,
          category: furnitureCategory._id,
          seller: sellerUser.id,
          status: 'active',
        },
      ]);
    });

    it('should filter listings by category correctly', async () => {
      const res = await request(app)
        .get('/api/listings')
        .query({ category: furnitureCategory._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.listings.length).toBe(1);
      expect(res.body.listings[0].title).toBe('Wooden Chair');
    });

    it('should filter listings by minPrice and maxPrice correctly', async () => {
      const res = await request(app)
        .get('/api/listings')
        .query({ minPrice: 100, maxPrice: 600 });

      expect(res.status).toBe(200);
      expect(res.body.listings.length).toBe(1);
      expect(res.body.listings[0].title).toBe('Budget Phone');
    });
  });

  describe('PUT /api/listings/:id and DELETE /api/listings/:id authorization & soft delete', () => {
    let createdListing;
    let otherSellerToken;

    beforeEach(async () => {
      createdListing = await Listing.create({
        title: 'Original Title',
        description: 'Original description',
        price: 300,
        category: categoryDoc._id,
        seller: sellerUser.id,
        status: 'active',
      });

      const otherRes = await request(app).post('/api/auth/signup').send({
        name: 'Other Seller',
        email: 'otherseller@example.com',
        password: 'password123',
        role: 'seller',
      });
      otherSellerToken = otherRes.body.token;
    });

    it('should return 403 when another user attempts to update listing', async () => {
      const res = await request(app)
        .put(`/api/listings/${createdListing._id}`)
        .set('Authorization', `Bearer ${otherSellerToken}`)
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(403);
    });

    it('should return 403 when another user attempts to delete listing', async () => {
      const res = await request(app)
        .delete(`/api/listings/${createdListing._id}`)
        .set('Authorization', `Bearer ${otherSellerToken}`);

      expect(res.status).toBe(403);
    });

    it('should soft-delete listing when owner deletes it (status changes to removed, document remains)', async () => {
      const res = await request(app)
        .delete(`/api/listings/${createdListing._id}`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Listing removed');

      // Verify in DB that document still exists with status 'removed'
      const docInDb = await Listing.findById(createdListing._id);
      expect(docInDb).not.toBeNull();
      expect(docInDb.status).toBe('removed');
    });
  });
});
