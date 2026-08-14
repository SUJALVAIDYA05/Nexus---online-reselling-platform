const request = require('supertest');
const app = require('../server');
const Category = require('../models/Category');
const Listing = require('../models/Listing');
const Favorite = require('../models/Favorite');

describe('Favorites Endpoints', () => {
  let buyerToken;
  let buyerUser;
  let sellerUser;
  let listingDoc;

  beforeEach(async () => {
    const category = await Category.create({
      name: 'Gadgets',
      slug: 'gadgets',
    });

    const sellerRes = await request(app).post('/api/auth/signup').send({
      name: 'Seller User',
      email: 'seller@example.com',
      password: 'password123',
      role: 'seller',
    });
    sellerUser = sellerRes.body.user;

    const buyerRes = await request(app).post('/api/auth/signup').send({
      name: 'Buyer User',
      email: 'buyer@example.com',
      password: 'password123',
      role: 'buyer',
    });
    buyerToken = buyerRes.body.token;
    buyerUser = buyerRes.body.user;

    listingDoc = await Listing.create({
      title: 'Wireless Headphones',
      description: 'Noise cancelling headphones',
      price: 150,
      category: category._id,
      seller: sellerUser.id,
      status: 'active',
    });
  });

  describe('POST /api/favorites', () => {
    it('should return 401 when adding a favorite without auth token', async () => {
      const res = await request(app)
        .post('/api/favorites')
        .send({ listingId: listingDoc._id.toString() });

      expect(res.status).toBe(401);
    });

    it('should add a favorite successfully with valid auth token', async () => {
      const res = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: listingDoc._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.listing).toBe(listingDoc._id.toString());
      expect(res.body.user).toBe(buyerUser.id);
    });

    it('should return 409 and not create duplicates when adding the same listing twice', async () => {
      // First add
      await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: listingDoc._id.toString() });

      // Second add attempt
      const res = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: listingDoc._id.toString() });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already in your favorites');

      // Verify DB count is 1
      const count = await Favorite.countDocuments({
        user: buyerUser.id,
        listing: listingDoc._id,
      });
      expect(count).toBe(1);
    });
  });

  describe('DELETE /api/favorites/:listingId and GET /api/favorites', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: listingDoc._id.toString() });
    });

    it('should remove favorite and reflect removal in favorites list', async () => {
      // Verify present first
      let getRes = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.length).toBe(1);

      // Remove favorite
      const delRes = await request(app)
        .delete(`/api/favorites/${listingDoc._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.message).toBe('Removed from favorites');

      // Verify removed from list
      getRes = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.length).toBe(0);
    });
  });
});
