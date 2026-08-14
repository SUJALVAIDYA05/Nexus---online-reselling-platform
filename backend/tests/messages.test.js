const request = require('supertest');
const app = require('../server');
const Category = require('../models/Category');
const Listing = require('../models/Listing');
const Conversation = require('../models/Conversation');

describe('Messages & Conversations Endpoints', () => {
  let buyerToken;
  let buyerUser;
  let sellerToken;
  let sellerUser;
  let thirdToken;
  let listingDoc;

  beforeEach(async () => {
    const category = await Category.create({
      name: 'Books',
      slug: 'books',
    });

    const sellerRes = await request(app).post('/api/auth/signup').send({
      name: 'Seller User',
      email: 'seller@example.com',
      password: 'password123',
      role: 'seller',
    });
    sellerToken = sellerRes.body.token;
    sellerUser = sellerRes.body.user;

    const buyerRes = await request(app).post('/api/auth/signup').send({
      name: 'Buyer User',
      email: 'buyer@example.com',
      password: 'password123',
      role: 'buyer',
    });
    buyerToken = buyerRes.body.token;
    buyerUser = buyerRes.body.user;

    const thirdRes = await request(app).post('/api/auth/signup').send({
      name: 'Third User',
      email: 'third@example.com',
      password: 'password123',
      role: 'buyer',
    });
    thirdToken = thirdRes.body.token;

    listingDoc = await Listing.create({
      title: 'Textbook',
      description: 'Used textbook in great condition',
      price: 45,
      category: category._id,
      seller: sellerUser.id,
      status: 'active',
    });
  });

  describe('POST /api/conversations', () => {
    it('should start a conversation between buyer and seller', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: listingDoc._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.listing._id).toBe(listingDoc._id.toString());
      const participantIds = res.body.participants.map((p) => p.id || (p._id && p._id.toString()));
      expect(participantIds).toContain(buyerUser.id);
      expect(participantIds).toContain(sellerUser.id);
    });
  });

  describe('Conversation Privacy & Authorization (403 for Third Party)', () => {
    let conversationId;

    beforeEach(async () => {
      const convRes = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: listingDoc._id.toString() });
      conversationId = convRes.body._id;
    });

    it('should prevent third user from reading messages of conversation (403)', async () => {
      const res = await request(app)
        .get(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${thirdToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Not authorized');
    });

    it('should prevent third user from posting to conversation (403)', async () => {
      const res = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${thirdToken}`)
        .send({ text: 'Unauthorized message attempt' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Not authorized');
    });
  });

  describe('POST /api/conversations/:id/messages and lastMessageAt update', () => {
    let conversationId;
    let initialConversation;

    beforeEach(async () => {
      const convRes = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: listingDoc._id.toString() });
      conversationId = convRes.body._id;
      initialConversation = await Conversation.findById(conversationId);
    });

    it('should send a message and update lastMessageAt on the conversation', async () => {
      // Wait a tiny delay to ensure timestamp change
      await new Promise((resolve) => setTimeout(resolve, 50));

      const msgRes = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ text: 'Hello, is this still available?' });

      expect(msgRes.status).toBe(200);
      expect(msgRes.body).toHaveProperty('_id');
      expect(msgRes.body.text).toBe('Hello, is this still available?');

      // Check updated conversation in DB
      const updatedConv = await Conversation.findById(conversationId);
      expect(new Date(updatedConv.lastMessageAt).getTime()).toBeGreaterThan(
        new Date(initialConversation.lastMessageAt).getTime()
      );
    });
  });
});
