/**
 * Migration script — backfills the `role` field on existing users.
 *
 *  1. Sets role: 'buyer' on any user document missing the field
 *     (new docs get it from the schema default; this covers pre-existing users).
 *  2. Ensures the user matching ADMIN_EMAIL is always role: 'admin'
 *     (in case they registered before roles existed).
 *
 * Idempotent — safe to run multiple times.
 * Usage:  node scripts/migrateRoles.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../db');
const User = require('../models/User');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'sujalv641@gmail.com').toLowerCase();

async function migrate() {
  await connectDB();

  // 1. Backfill missing role → buyer
  const backfill = await User.updateMany(
    { role: { $exists: false } },
    { $set: { role: 'buyer' } }
  );
  console.log(`Backfilled 'buyer' role on ${backfill.modifiedCount} user(s) without a role.`);

  // 2. Promote the admin email
  const promoted = await User.updateOne(
    { email: ADMIN_EMAIL, role: { $ne: 'admin' } },
    { $set: { role: 'admin' } }
  );
  if (promoted.modifiedCount > 0) {
    console.log(`Granted 'admin' role to ${ADMIN_EMAIL}.`);
  } else {
    console.log(`No change for admin email ${ADMIN_EMAIL} (either not found or already admin).`);
  }

  // 3. Summary
  const counts = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  console.log('\nRole distribution:');
  if (counts.length === 0) {
    console.log('  (no users in the database)');
  }
  for (const c of counts) {
    console.log(`  ${c._id}: ${c.count}`);
  }

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
