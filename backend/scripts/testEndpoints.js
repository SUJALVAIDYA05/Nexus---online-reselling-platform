/**
 * Phase 2 — Smoke test for all new endpoints.
 * Run: node scripts/testEndpoints.js
 */

const BASE = 'http://localhost:3000/api';

async function request(method, path, body, token) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

function assert(label, condition) {
  if (condition) {
    console.log(`  ✔ ${label}`);
  } else {
    console.error(`  ✘ ${label}`);
    process.exitCode = 1;
  }
}

async function run() {
  console.log('\n=== Phase 2 Endpoint Tests ===\n');

  // ---------- 1. Sign up a test user ----------
  console.log('1. Auth — signup');
  const ts = Date.now();
  const signup = await request('POST', '/auth/signup', {
    name: `Tester ${ts}`,
    email: `test${ts}@nexus.dev`,
    password: 'password123',
  });
  assert('Signup returns 201', signup.status === 201);
  const token = signup.data?.token;
  const userId = signup.data?.user?.id;
  assert('Token received', !!token);

  // ---------- 2. Categories ----------
  console.log('\n2. Categories');
  const cats = await request('GET', '/categories');
  assert('GET /categories returns 200', cats.status === 200);
  assert('Has seeded categories', Array.isArray(cats.data) && cats.data.length >= 10);
  const categoryId = cats.data[0]._id;

  // Create a category (protected)
  const newCat = await request('POST', '/categories', { name: `Test Cat ${ts}` }, token);
  assert('POST /categories returns 201', newCat.status === 201);

  // Unauthenticated create should fail
  const noAuthCat = await request('POST', '/categories', { name: 'Nope' });
  assert('POST /categories without auth returns 401', noAuthCat.status === 401);

  // ---------- 3. Listings — Create ----------
  console.log('\n3. Listings — Create');
  const listing1 = await request('POST', '/listings', {
    title: 'Test Laptop',
    description: 'A great laptop for testing',
    price: 50000,
    category: categoryId,
    condition: 'good',
    location: 'Mumbai',
  }, token);
  assert('POST /listings returns 201', listing1.status === 201);
  assert('Seller set from JWT', listing1.data?.seller?.toString() === userId);
  const listingId = listing1.data?._id;

  // Missing fields
  const badListing = await request('POST', '/listings', { title: 'No price' }, token);
  assert('POST /listings missing fields returns 400', badListing.status === 400);

  // Unauthenticated
  const noAuthListing = await request('POST', '/listings', {
    title: 'x', description: 'x', price: 1, category: categoryId,
  });
  assert('POST /listings without auth returns 401', noAuthListing.status === 401);

  // ---------- 4. Listings — Read ----------
  console.log('\n4. Listings — Read');
  const allListings = await request('GET', '/listings');
  assert('GET /listings returns 200', allListings.status === 200);
  assert('Pagination shape present', typeof allListings.data?.total === 'number');

  const single = await request('GET', `/listings/${listingId}`);
  assert('GET /listings/:id returns 200', single.status === 200);
  assert('Seller populated with name', !!single.data?.seller?.name);
  assert('Category populated', !!single.data?.category?.name);

  // Filters
  const filtered = await request('GET', `/listings?category=${categoryId}&minPrice=100&maxPrice=999999&location=Mumbai`);
  assert('Filtered query returns 200', filtered.status === 200);

  // Invalid ID
  const badId = await request('GET', '/listings/notanid');
  assert('GET /listings/badId returns 400', badId.status === 400);

  // Non-existent ID
  const notFound = await request('GET', '/listings/000000000000000000000000');
  assert('GET /listings/nonexistent returns 404', notFound.status === 404);

  // ---------- 5. Listings — Update ----------
  console.log('\n5. Listings — Update');
  const updated = await request('PUT', `/listings/${listingId}`, { price: 45000 }, token);
  assert('PUT /listings/:id returns 200', updated.status === 200);
  assert('Price updated', updated.data?.price === 45000);

  // ---------- 6. User listings ----------
  console.log('\n6. User listings');
  const userListings = await request('GET', `/users/${userId}/listings`);
  assert('GET /users/:id/listings returns 200', userListings.status === 200);
  assert('Returns array', Array.isArray(userListings.data));

  // ---------- 7. Favorites ----------
  console.log('\n7. Favorites');
  const addFav = await request('POST', '/favorites', { listingId }, token);
  assert('POST /favorites returns 201', addFav.status === 201);

  // Duplicate
  const dupFav = await request('POST', '/favorites', { listingId }, token);
  assert('Duplicate favorite returns 409', dupFav.status === 409);

  // List favorites
  const myFavs = await request('GET', '/favorites', null, token);
  assert('GET /favorites returns 200', myFavs.status === 200);
  assert('Favorites list has items', Array.isArray(myFavs.data) && myFavs.data.length > 0);

  // Remove favorite
  const rmFav = await request('DELETE', `/favorites/${listingId}`, null, token);
  assert('DELETE /favorites/:listingId returns 200', rmFav.status === 200);

  // Remove again — should 404
  const rmAgain = await request('DELETE', `/favorites/${listingId}`, null, token);
  assert('DELETE non-existent favorite returns 404', rmAgain.status === 404);

  // Unauthenticated favorites
  const noAuthFav = await request('GET', '/favorites');
  assert('GET /favorites without auth returns 401', noAuthFav.status === 401);

  // ---------- 8. Soft delete ----------
  console.log('\n8. Soft delete');
  const del = await request('DELETE', `/listings/${listingId}`, null, token);
  assert('DELETE /listings/:id returns 200', del.status === 200);

  // Verify removed listing excluded from list
  const afterDel = await request('GET', '/listings');
  const ids = (afterDel.data?.listings || []).map(l => l._id);
  assert('Removed listing excluded from GET /listings', !ids.includes(listingId));

  // ---------- 9. Ownership check ----------
  console.log('\n9. Ownership guard');
  // Create second user
  const signup2 = await request('POST', '/auth/signup', {
    name: `Tester2 ${ts}`,
    email: `test2_${ts}@nexus.dev`,
    password: 'password123',
  });
  const token2 = signup2.data?.token;

  // Create a listing as user 1, try to update as user 2
  const listing2 = await request('POST', '/listings', {
    title: 'Owner Test',
    description: 'Testing ownership',
    price: 100,
    category: categoryId,
  }, token);
  const listing2Id = listing2.data?._id;

  const foreignUpdate = await request('PUT', `/listings/${listing2Id}`, { price: 1 }, token2);
  assert('PUT by non-owner returns 403', foreignUpdate.status === 403);

  const foreignDelete = await request('DELETE', `/listings/${listing2Id}`, null, token2);
  assert('DELETE by non-owner returns 403', foreignDelete.status === 403);

  console.log('\n=== Done ===\n');
}

run().catch(console.error);
