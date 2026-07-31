/**
 * Endpoint smoke tests — covers auth, roles, listings, favorites, orders.
 * Run: node scripts/testEndpoints.js
 */

const BASE = 'http://localhost:3000/api';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'sujalv641@gmail.com').toLowerCase();

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
  console.log('\n=== Endpoint Tests ===\n');
  const ts = Date.now();

  // ---------- 1. Sign up a buyer and a seller ----------
  console.log('1. Auth — signup with roles');
  const buyer = await request('POST', '/auth/signup', {
    name: `Buyer ${ts}`,
    email: `buyer${ts}@nexus.dev`,
    password: 'password123',
    role: 'buyer',
  });
  assert('Buyer signup returns 201', buyer.status === 201);
  assert('Buyer role is buyer', buyer.data?.user?.role === 'buyer');
  const buyerToken = buyer.data?.token;
  const buyerId = buyer.data?.user?.id;

  const seller = await request('POST', '/auth/signup', {
    name: `Seller ${ts}`,
    email: `seller${ts}@nexus.dev`,
    password: 'password123',
    role: 'seller',
  });
  assert('Seller signup returns 201', seller.status === 201);
  assert('Seller role is seller', seller.data?.user?.role === 'seller');
  const sellerToken = seller.data?.token;
  const sellerId = seller.data?.user?.id;

  // Admin cannot be chosen via the role field
  const fakeAdmin = await request('POST', '/auth/signup', {
    name: `Fake ${ts}`,
    email: `fakeadmin${ts}@nexus.dev`,
    password: 'password123',
    role: 'admin',
  });
  assert('Client-supplied admin role is ignored (becomes buyer)', fakeAdmin.data?.user?.role === 'buyer');

  // The real admin email always becomes admin regardless of submitted role
  let adminToken = null;
  let adminId = null;
  const adminSignup = await request('POST', '/auth/signup', {
    name: `Admin ${ts}`,
    email: ADMIN_EMAIL,
    password: 'password123',
    role: 'buyer',
  });
  if (adminSignup.status === 201) {
    assert('Admin email signup is granted admin role', adminSignup.data?.user?.role === 'admin');
    adminToken = adminSignup.data?.token;
    adminId = adminSignup.data?.user?.id;
  } else {
    console.log(`  (admin account ${ADMIN_EMAIL} already exists — skipping admin account tests)`);
  }

  // ---------- 2. Categories ----------
  console.log('\n2. Categories');
  const cats = await request('GET', '/categories');
  assert('GET /categories returns 200', cats.status === 200);
  const categoryId = cats.data[0]?._id;
  assert('Categories present', !!categoryId);

  const buyerCat = await request('POST', '/categories', { name: `No ${ts}` }, buyerToken);
  assert('POST /categories as buyer returns 403', buyerCat.status === 403);
  const noAuthCat = await request('POST', '/categories', { name: 'Nope' });
  assert('POST /categories without auth returns 401', noAuthCat.status === 401);

  // ---------- 3. Listings — role-based creation ----------
  console.log('\n3. Listings — role-based create');
  const buyerListing = await request('POST', '/listings', {
    title: 'x', description: 'x', price: 1, category: categoryId,
  }, buyerToken);
  assert('POST /listings as buyer returns 403', buyerListing.status === 403);

  const listing1 = await request('POST', '/listings', {
    title: 'Test Laptop',
    description: 'A great laptop for testing',
    price: 50000,
    category: categoryId,
    condition: 'good',
    location: 'Mumbai',
  }, sellerToken);
  assert('POST /listings as seller returns 201', listing1.status === 201);
  assert('Seller set from JWT', listing1.data?.seller?.toString() === sellerId);
  const listingId = listing1.data?._id;

  // Missing fields
  const badListing = await request('POST', '/listings', { title: 'No price' }, sellerToken);
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

  const badId = await request('GET', '/listings/notanid');
  assert('GET /listings/badId returns 400', badId.status === 400);

  // ---------- 5. Listings — Update ----------
  console.log('\n5. Listings — Update');
  const updated = await request('PUT', `/listings/${listingId}`, { price: 45000 }, sellerToken);
  assert('PUT /listings/:id as owner returns 200', updated.status === 200);
  assert('Price updated', updated.data?.price === 45000);

  const buyerUpdate = await request('PUT', `/listings/${listingId}`, { price: 1 }, buyerToken);
  assert('PUT /listings/:id as buyer returns 403', buyerUpdate.status === 403);

  // ---------- 6. User listings ----------
  console.log('\n6. User listings');
  const userListings = await request('GET', `/users/${sellerId}/listings`);
  assert('GET /users/:id/listings returns 200', userListings.status === 200);
  assert('Returns array', Array.isArray(userListings.data));

  // ---------- 7. Favorites — buyer only ----------
  console.log('\n7. Favorites');
  const sellerFav = await request('POST', '/favorites', { listingId }, sellerToken);
  assert('POST /favorites as seller returns 403', sellerFav.status === 403);

  const addFav = await request('POST', '/favorites', { listingId }, buyerToken);
  assert('POST /favorites as buyer returns 201', addFav.status === 201);

  const dupFav = await request('POST', '/favorites', { listingId }, buyerToken);
  assert('Duplicate favorite returns 409', dupFav.status === 409);

  const rmFav = await request('DELETE', `/favorites/${listingId}`, null, buyerToken);
  assert('DELETE /favorites/:listingId returns 200', rmFav.status === 200);

  // ---------- 8. Orders ----------
  console.log('\n8. Orders');
  // Sellers cannot place orders
  const sellerOrder = await request('POST', '/orders', {
    items: [listingId],
    shippingAddress: { fullName: 'S', phone: '9876543210', pincode: '400001', addressLine: 'x', city: 'Mumbai', state: 'Maharashtra' },
    paymentMethod: 'upi',
  }, sellerToken);
  assert('POST /orders as seller returns 403', sellerOrder.status === 403);

  // Buyer cannot order their own listing — create one as... only seller/admin can.
  // (Buyer has no listings, so create a second seller-owned listing for ordering.)
  const listing2 = await request('POST', '/listings', {
    title: 'Orderable Item',
    description: 'For order tests',
    price: 2000,
    category: categoryId,
  }, sellerToken);
  const listing2Id = listing2.data?._id;

  // Invalid payment method
  const badOrder = await request('POST', '/orders', {
    items: [listing2Id],
    shippingAddress: {},
    paymentMethod: 'card',
  }, buyerToken);
  assert('POST /orders bad payment method returns 400', badOrder.status === 400);

  const order = await request('POST', '/orders', {
    items: [listing2Id],
    shippingAddress: {
      fullName: 'Buyer One',
      phone: '9876543210',
      pincode: '400001',
      addressLine: '42 Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
    },
    paymentMethod: 'upi',
  }, buyerToken);
  assert('POST /orders as buyer returns 201', order.status === 201);
  assert('Order has computed fee', order.data?.platformFee === 100); // 5% of 2000
  assert('Order total correct', order.data?.totalAmount === 2100);
  const orderId = order.data?._id;

  // Ordered listing is marked sold → leaves active browse
  const afterOrder = await request('GET', '/listings');
  const activeIds = (afterOrder.data?.listings || []).map(l => l._id);
  assert('Ordered listing removed from active listings', !activeIds.includes(listing2Id));

  // Ordering a sold listing returns 409
  const soldOrder = await request('POST', '/orders', {
    items: [listing2Id],
    shippingAddress: {},
    paymentMethod: 'cod',
  }, buyerToken);
  assert('Ordering a sold listing returns 409', soldOrder.status === 409);

  // Buyer views their orders
  const buyerOrders = await request('GET', '/orders', null, buyerToken);
  assert('GET /orders as buyer returns own orders', buyerOrders.status === 200
    && Array.isArray(buyerOrders.data?.orders)
    && buyerOrders.data.orders.every(o => o.buyer?._id?.toString?.() === buyerId || o.buyer?.toString?.() === buyerId));

  // Seller views orders containing their items
  const sellerOrders = await request('GET', '/orders', null, sellerToken);
  assert('GET /orders as seller returns sales', sellerOrders.status === 200
    && Array.isArray(sellerOrders.data?.orders)
    && sellerOrders.data.orders.length > 0);

  // Buyer cannot update order status (seller/admin only)
  const buyerStatus = await request('PUT', `/orders/${orderId}/status`, { status: 'shipped' }, buyerToken);
  assert('PUT /orders/:id/status as buyer returns 403', buyerStatus.status === 403);

  // Seller can update status for their own sale
  const shipOrder = await request('PUT', `/orders/${orderId}/status`, { status: 'shipped' }, sellerToken);
  assert('Seller can update status of their order', shipOrder.status === 200);

  // Buyer can still view the order
  const viewOrder = await request('GET', `/orders/${orderId}`, null, buyerToken);
  assert('Buyer can view their order', viewOrder.status === 200);

  // Foreign buyer cannot view another's order
  const foreignView = await request('GET', `/orders/${orderId}`, null, (await request('POST', '/auth/signup', {
    name: `Stranger ${ts}`,
    email: `stranger${ts}@nexus.dev`,
    password: 'password123',
  })).data?.token);
  assert('Foreign buyer cannot view order (403)', foreignView.status === 403);

  // ---------- 9. Ownership guard on listings ----------
  console.log('\n9. Ownership guard');
  const signup3 = await request('POST', '/auth/signup', {
    name: `Seller2 ${ts}`,
    email: `seller2_${ts}@nexus.dev`,
    password: 'password123',
    role: 'seller',
  });
  const token3 = signup3.data?.token;

  const foreignUpdate = await request('PUT', `/listings/${listingId}`, { price: 1 }, token3);
  assert('PUT by non-owner seller returns 403', foreignUpdate.status === 403);

  const foreignDelete = await request('DELETE', `/listings/${listingId}`, null, token3);
  assert('DELETE by non-owner seller returns 403', foreignDelete.status === 403);

  // Admin bypass — if an admin token is available
  if (adminToken) {
    console.log('\n10. Admin capabilities');
    const adminListings = await request('GET', '/users', null, adminToken);
    assert('GET /users as admin returns 200', adminListings.status === 200);
    assert('Users list has items', Array.isArray(adminListings.data?.users) && adminListings.data.users.length > 0);
    assert('Users list excludes password', !JSON.stringify(adminListings.data).includes('"password"'));

    const adminAllOrders = await request('GET', '/orders', null, adminToken);
    assert('GET /orders as admin returns all orders', adminAllOrders.status === 200 && adminAllOrders.data?.orders?.length > 0);

    const adminDelete = await request('DELETE', `/listings/${listingId}`, null, adminToken);
    assert('Admin can delete any listing', adminDelete.status === 200);
  } else {
    const buyerDelete = await request('DELETE', `/listings/${listingId}`, null, buyerToken);
    assert('Buyer cannot delete a listing (403)', buyerDelete.status === 403);
  }

  // Cleanup created listing if still present
  await request('DELETE', `/listings/${listingId}`, null, sellerToken);

  console.log('\n=== Done ===\n');
}

run().catch(console.error);
