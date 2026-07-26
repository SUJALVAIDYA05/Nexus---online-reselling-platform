const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing is required'],
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate conversations for the same listing+buyer pair
// Participants array is sorted before saving to ensure consistent index keys
conversationSchema.index({ listing: 1, participants: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);
