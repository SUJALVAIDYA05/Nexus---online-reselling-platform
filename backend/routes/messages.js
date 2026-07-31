const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { messageLimiter } = require('../middleware/rateLimiter');
const { messageRules, conversationRules } = require('../middleware/validators');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Listing = require('../models/Listing');

// POST / - Create or find conversation
router.post('/', authMiddleware, conversationRules, async (req, res, next) => {
  try {
    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ error: 'listingId is required' });

    const listing = await Listing.findById(listingId).populate('seller');
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const sellerId = listing.seller._id ? listing.seller._id.toString() : listing.seller.toString();
    if (sellerId === req.user.id) {
      return res.status(400).json({ error: 'You cannot message yourself' });
    }

    const participants = [req.user.id, sellerId].sort();

    let conversation = await Conversation.findOne({
      listing: listingId,
      participants
    });

    if (!conversation) {
      conversation = await Conversation.create({
        listing: listingId,
        participants
      });
    }

    conversation = await conversation.populate([
      { path: 'listing', select: 'title images price' },
      { path: 'participants', select: 'name avatarUrl' }
    ]);

    res.json(conversation);
  } catch (error) {
    next(error);
  }
});

// GET / - List conversations for current user
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .sort({ lastMessageAt: -1 })
      .populate({ path: 'listing', select: 'title images price' })
      .populate({ path: 'participants', select: 'name avatarUrl' })
      .lean();

    // count unread messages
    for (let conv of conversations) {
      conv.unreadCount = await Message.countDocuments({
        conversation: conv._id,
        readBy: { $ne: req.user.id }
      });
    }

    res.json({ conversations });
  } catch (error) {
    next(error);
  }
});

// GET /:id/messages - Get messages for a conversation
router.get('/:id/messages', authMiddleware, async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    if (!conversation.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversation: req.params.id })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name avatarUrl');

    const total = await Message.countDocuments({ conversation: req.params.id });
    const totalPages = Math.ceil(total / limit);

    res.json({ messages, page, totalPages, total });
  } catch (error) {
    next(error);
  }
});

// POST /:id/messages - Send a message
router.post('/:id/messages', authMiddleware, messageLimiter, messageRules, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    if (!conversation.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({ error: 'Not authorized to send a message' });
    }

    let message = await Message.create({
      conversation: req.params.id,
      sender: req.user.id,
      text: text.trim(),
      readBy: [req.user.id]
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    message = await message.populate('sender', 'name avatarUrl');

    res.json(message);
  } catch (error) {
    next(error);
  }
});

// POST /:id/read - Mark messages as read
router.post('/:id/read', authMiddleware, async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    if (!conversation.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Message.updateMany(
      { conversation: req.params.id },
      { $addToSet: { readBy: req.user.id } }
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
