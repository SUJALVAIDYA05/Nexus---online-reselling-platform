const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the MONGO_URI environment variable.
 * Exits the process with a helpful message if the connection fails.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('FATAL: MONGO_URI is not set in environment variables. Exiting.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('FATAL: Could not connect to MongoDB:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
