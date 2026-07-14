/**
 * Seed script — populates the database with starter categories.
 *
 * Usage:  node scripts/seedCategories.js
 *
 * Safe to re-run: uses updateOne + upsert so existing categories
 * are updated (not duplicated).
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../db');
const Category = require('../models/Category');

const CATEGORIES = [
  { name: 'Mobiles', slug: 'mobiles' },
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Vehicles', slug: 'vehicles' },
  { name: 'Furniture', slug: 'furniture' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Real Estate', slug: 'real-estate' },
  { name: 'Jobs', slug: 'jobs' },
  { name: 'Services', slug: 'services' },
  { name: 'Books & Hobbies', slug: 'books-hobbies' },
  { name: 'Pets', slug: 'pets' },
];

async function seed() {
  await connectDB();

  console.log('Seeding categories...');

  for (const cat of CATEGORIES) {
    await Category.updateOne(
      { slug: cat.slug },
      { $set: cat },
      { upsert: true }
    );
    console.log(`  ✔ ${cat.name}`);
  }

  console.log(`\nDone — ${CATEGORIES.length} categories seeded.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
