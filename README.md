# NEXUS — Online Reselling Platform

A full-stack marketplace web application for buying and selling pre-owned goods. NEXUS lets users browse/search listings, save items to a wishlist, chat with sellers, add items to a cart, and complete a real, server-persisted checkout with an escrow-style flow. It has **role-based access control** (buyer / seller / admin), with the admin account bound to a fixed email. All prices are handled in **Indian Rupees (₹)**.

### Roles
| Role | Browse | Create/Edit/Delete listings | Order/Buy | Moderate platform |
| --- | --- | --- | --- | --- |
| **Buyer** | Yes | No | Yes | No |
| **Seller** | Yes | Own listings only | No | No |
| **Admin** | Yes | Any listing | Yes | Yes |

- Signup lets clients choose only `buyer` or `seller`; the `admin` role is **never** client-assignable.
- The account matching `ADMIN_EMAIL` (default `sujalv641@gmail.com`) is automatically granted `admin` on signup/login, and existing users are backfilled by `migrateRoles.js`.

## Tech Stack

**Frontend** — `frontend/`
- React 19 + Vite 8 + JavaScript (JSX)
- React Router v6
- Framer Motion (animations) · lucide-react (icons) · react-hot-toast (toasts) · canvas-confetti (celebrations)
- Linting via `oxlint`

**Backend** — `backend/`
- Node.js + Express 4 + MongoDB (Mongoose 8)
- JWT authentication (`jsonwebtoken`), bcrypt password hashing
- Cloudinary for image storage (`multer-storage-cloudinary`), Multer for uploads
- `dotenv` for configuration

**Infrastructure**
- Dev: Vite dev server (port 5173) proxies `/api` → Express (port 3000). No CORS setup needed.
- Prod: `npm run build` in `frontend/` produces `frontend/dist/`, which the Express server serves statically with SPA fallback to `index.html`.

---

## Project Structure

```
Nexus---online-reselling-platform/
├── backend/
│   ├── config/
│   │   └── cloudinary.js        # Cloudinary SDK config
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verify (cookie or Bearer) + attaches full user w/ role
│   │   ├── requireRole.js       # Role-based access control (buyer/seller/admin)
│   │   ├── errorHandler.js      # Centralized error handler
│   │   ├── upload.js            # Multer + Cloudinary storage (max 6 img, 5MB each)
│   │   └── validateObjectId.js  # Validates :id params are valid ObjectIds
│   ├── models/
│   │   ├── User.js              # Users (bcrypt 12 rounds, password hidden, role field)
│   │   ├── Listing.js           # Listings (text index on title+description)
│   │   ├── Category.js          # Categories
│   │   ├── Favorite.js          # Wishlist pairs (unique user+listing)
│   │   ├── Conversation.js      # Chat threads (unique listing+participants)
│   │   ├── Message.js           # Messages (max 2000 chars)
│   │   └── Order.js             # Orders (items, prices at purchase, 5% fee, status)
│   ├── routes/
│   │   ├── listings.js          # CRUD + search/filter/pagination (seller/admin only write)
│   │   ├── categories.js        # List (public) / create (admin only)
│   │   ├── favorites.js         # Wishlist endpoints (buyer/admin only)
│   │   ├── users.js             # Profile update + user listings + admin user list
│   │   ├── messages.js          # Conversations + messages
│   │   ├── uploads.js           # Multi-image upload
│   │   └── orders.js            # Create/list/view orders + status updates
│   ├── scripts/
│   │   ├── seedCategories.js    # Seed 10 starter categories (idempotent)
│   │   ├── migrateRoles.js      # Backfill role field + promote ADMIN_EMAIL (idempotent)
│   │   └── testEndpoints.js     # API smoke tests incl. roles & orders
│   ├── db.js                    # MongoDB connection
│   ├── server.js                # Express entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/api.js           # Fetch wrapper + API modules (auth, listings, orders, ...)
│   │   ├── components/
│   │   │   ├── RequireRole.jsx  # Route guard by role
│   │   │   ├── layout/          # Layout, Navbar, Footer, Sidebar, DashboardLayout
│   │   │   ├── listing/         # ListingCard
│   │   │   └── ui/              # Button, Input, Card, Badge, Modal, Spinner,
│   │   │                        #   Pagination, SearchBar, EmptyState, PageTransition
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Session state (incl. user.role)
│   │   │   ├── CartContext.jsx      # Cart (localStorage: nexus_cart)
│   │   │   └── FavoritesContext.jsx # Global wishlist state
│   │   ├── pages/               # 24 pages (see Routing) incl. AdminDashboard
│   │   ├── styles/globals.css   # Design tokens + theme
│   │   ├── App.jsx              # Providers + routes
│   │   └── main.jsx             # React entry
│   ├── index.html
│   ├── vite.config.js           # Dev server + /api proxy
│   └── package.json
│
└── public/
    ├── browse.html              # Legacy static browse page
    └── _legacy/                 # Old static HTML prototype pages
```

---

## Backend API

Base URL: `/api`. JSON request/response. Auth via `httpOnly` cookie (`token`) or `Authorization: Bearer <jwt>`.

### Auth (defined in `server.js`)
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Public | Create account (name, email, password ≥ 6 chars). Optional `role` — only `buyer`/`seller` accepted; `admin` email is auto-granted. Sets cookie, returns `{ user, token }`. |
| POST | `/api/auth/login` | Public | Login with email/password. Sets cookie, returns `{ user, token }`. |
| GET | `/api/auth/me` | Protected | Returns current user (includes `role`) from JWT. |
| POST | `/api/auth/logout` | Public | Clears the auth cookie. |

### Listings — `routes/listings.js`
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/listings` | Public | Active listings. Query: `q`, `category`, `location`, `minPrice`, `maxPrice`, `sort` (`price_asc`/`price_desc`), `page`, `limit` (max 100). Returns `{ listings, page, limit, total, totalPages }`. Falls back to regex search if text index missing (error 27). |
| GET | `/api/listings/:id` | Public | Single listing (populates category + seller). |
| POST | `/api/listings` | Seller/Admin | Create listing; `seller` taken from JWT. Buyers get 403. |
| PUT | `/api/listings/:id` | Seller/Admin | Update listing (whitelisted fields only). Owner seller, or admin bypassing ownership. |
| DELETE | `/api/listings/:id` | Seller/Admin | Delete listing + its Cloudinary images. Owner seller, or admin bypassing ownership. |

### Categories — `routes/categories.js`
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/categories` | Public | All categories (populates parent), sorted by name. |
| POST | `/api/categories` | Admin only | Create category (slug auto-generated from name). |

### Favorites (Wishlist) — `routes/favorites.js` (buyer/admin only)
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/favorites` | Buyer/Admin | User's wishlist (populated listings). Sellers get 403. |
| POST | `/api/favorites` | Buyer/Admin | Add `{ listingId }`. 409 if already favorited. |
| DELETE | `/api/favorites/:listingId` | Buyer/Admin | Remove favorite. 404 if not found. |

### Users — `routes/users.js`
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/users` | Admin only | Paginated list of all users (`page`, `limit`). Password always excluded. |
| GET | `/api/users/:id/listings` | Optional | Own listings (all statuses for owner, active only for others). |
| PUT | `/api/users/profile` | Protected | Update `name`, `phone`, `location`. |

### Uploads — `routes/uploads.js`
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/uploads` | Protected | Upload up to 6 images (field `images`) → Cloudinary. Returns `{ urls: [{ url, publicId }] }`. |

### Orders — `routes/orders.js`
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/orders` | Buyer/Admin | Create order. Body: `{ items: [listingId], shippingAddress, paymentMethod }`. Server re-fetches prices, rejects non-`active` items (409), rejects ordering your own listing, computes `subtotal` + 5% `platformFee` + `totalAmount`, creates the order, and marks purchased listings `sold`. |
| GET | `/api/orders` | Protected | Role-aware: buyers get their orders, sellers get orders containing their items, admins get everything. Paginated. |
| GET | `/api/orders/:id` | Protected | View one order — buyer, an item seller, or admin only (403 otherwise). |
| PUT | `/api/orders/:id/status` | Seller/Admin | Update status (`pending/confirmed/shipped/completed/cancelled`). Sellers only for orders containing their items; admins any. |

### Messages — `routes/messages.js` (mounted at `/api/messages`)
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/messages/conversations` | Protected | Create/find conversation for `{ listingId }` (can't message yourself). Open to buyers & sellers. |
| GET | `/api/messages/conversations` | Protected | User's conversations (sorted by `lastMessageAt`), with unread counts. |
| GET | `/api/messages/conversations/:id/messages` | Protected | Paginated messages (`page`, `limit`, default 50). |
| POST | `/api/messages/conversations/:id/messages` | Protected | Send `{ text }`. |
| POST | `/api/messages/conversations/:id/read` | Protected | Mark conversation read. |

---

## Data Models (Mongoose)

- **User**: `name`, `email` (unique, lowercase), `password` (bcrypt 12 rounds, `select:false`), `role` (`buyer | seller | admin`, default `buyer`), `phone`, `location`, `avatarUrl`. Instance method `comparePassword()`. The `admin` role is granted automatically only for `ADMIN_EMAIL`.
- **Listing**: `title`, `description`, `price` (INR, number), `category` (→Category), `condition` (`new | like-new | good | fair | poor`), `images` `[{ url, publicId }]`, `location`, `seller` (→User), `status` (`active | sold | removed`). Text index on `title`+`description`.
- **Category**: `name` (unique), `slug` (unique), `parent` (→Category, optional sub-category).
- **Favorite**: `user` (→User), `listing` (→Listing). Unique compound index `{ user, listing }`.
- **Conversation**: `listing` (→Listing), `participants` (array, sorted), `lastMessageAt`. Unique compound index `{ listing, participants }`.
- **Message**: `conversation` (→Conversation), `sender` (→User), `text` (max 2000), `readBy` (array). Index on `{ conversation, createdAt }`.
- **Order**: `buyer` (→User), `items` `[{ listing, seller, priceAtPurchase }]`, `subtotal`, `platformFee` (5%), `totalAmount`, `shippingAddress` (`fullName, phone, pincode, addressLine, city, state`), `paymentMethod` (`upi | cod`), `status` (`pending | confirmed | shipped | completed | cancelled`). Indexes on `{ buyer, createdAt }` and `{ items.seller, createdAt }`.

---

## Frontend Routing (24 pages)

| Route | Page | Access |
| --- | --- | --- |
| `/` | Home | Public |
| `/browse`, `/search` | Search (Browse) | Public |
| `/listing/:id` | ListingDetail | Public |
| `/login` | Login | Guests |
| `/register` | Register | Guests |
| `/about` | About | Public |
| `/services` | Services | Public |
| `/testimonials` | Testimonials | Public |
| `/cart` | Cart | Buyer/Admin |
| `/checkout` | Checkout | Buyer/Admin |
| `/favorites` | Favorites (Wishlist) | Buyer/Admin |
| `/orders` | Orders | Protected (role-aware) |
| `/messages` | Messages | Protected |
| `/create-listing` | CreateListing | Seller/Admin |
| `/listing-success` | ListingSuccess | Seller/Admin |
| `/edit-listing/:id` | EditListing | Seller/Admin |
| `/dashboard` | Dashboard | Protected (role-aware) |
| `/dashboard/my-listings` | MyListings | Seller/Admin |
| `/dashboard/profile` | Profile | Protected |
| `/dashboard/settings` | Settings | Protected |
| `/admin` | AdminDashboard | Admin |
| `*` | NotFound | Public |

Role-gating is enforced via the `<RequireRole allow={[...]}>` wrapper: unauthenticated users are redirected to `/login`, and authenticated users with the wrong role get a toast and are redirected to `/dashboard`.

### Key pages
- **Search/Browse** — keyword search, category/price-range/location/condition filters, sort (newest, price low→high, price high→low), pagination, mobile filter bar.
- **ListingDetail** — image gallery (thumbnails + prev/next), condition badge, INR price, Add to Cart, Chat Seller, heart (save item), seller card, similar listings. Role-aware: sellers see an info box and their own listings get a "Manage My Listing" action.
- **Dashboard** — role-based stats (admin: Total Users, Active Listings, Total Orders; seller: My Listings, Active Deals, Total Sales; buyer: My Orders, Wishlist Items), recent platform listings, quick actions.
- **MyListings** — All/Active/Sold tabs, View/Edit/Delete (confirm modal).
- **CreateListing / EditListing** — full form: title, category, condition, **price in ₹** (`IndianRupee` icon), location, description, up to 6 image uploads with previews.
- **Cart** — items from `CartContext` (localStorage), 5% platform guarantee fee (`PLATFORM_FEE_RATE = 0.05`), sticky order summary.
- **Checkout** — address form (10-digit phone, 6-digit pincode, Indian states dropdown) + payment (UPI / Cash on Delivery). On submit it creates a real order via `POST /api/orders`; success modal with confetti that clears the cart.
- **Favorites** — global wishlist grid from `FavoritesContext`; heart removal updates everywhere.
- **Messages** — two-pane inbox: conversation list (unread dots) + chat feed; URL param `?convo=id`.
- **Orders** — role-aware tabs from the live orders API (admin: All / Purchases / My Sales; seller: My Sales; buyer: Purchases), order cards with items/totals, and an inline status dropdown for sellers/admins.
- **AdminDashboard** (`/admin`) — platform overview: paginated Users table (view-only), Active Listings grid with Remove, platform-wide Orders table.
- **Settings** — Password & Security, Notifications, Danger Zone (delete account).
- **Home** — animated hero, top categories, "Fresh Arrivals", how-it-works, CTA.

---

## Global State (React Contexts)

- **AuthContext** — `user`, `loading`; `login`, `signup(name, email, password, role = 'buyer')`, `logout`, `checkAuth` (restores session via `/api/auth/me`), `setUser`. `user.role` drives all role-aware UI.
- **CartContext** — cart persisted to `localStorage` under `nexus_cart`; `items`, `addItem`, `removeItem`, `clearCart`, `total`, `count`.
- **FavoritesContext** — global wishlist loaded from `/api/favorites` when user changes (skipped for `role === 'seller'`); `favIds`, `favoriteListings`, `isFavorited(id)`, `toggleFavorite(id)` (optimistic update + rollback, toast feedback, guests redirected to `/login`). This is what makes the heart button stay in sync across Home, Search, Dashboard, ListingDetail, and Favorites.

---

## API Client (frontend)

`frontend/src/api/api.js` — fetch wrapper with `BASE_URL = '/api'` and `credentials: 'include'`. Normalizes errors to `{ status, message, data }`. Modules: `auth`, `listings`, `categories`, `favorites`, `users` (`list`, `updateProfile`, listings-by-user), `conversations`, `orders` (`list`, `get`, `create`, `updateStatus`), plus generic `get/post/put/delete` and `upload(files)`.

---

## Environment Variables (`backend/.env`)

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `MONGO_URI` | **Yes** | — | MongoDB connection string (server exits if missing). |
| `JWT_SECRET` | **Yes** | — | JWT signing secret (server exits if missing). |
| `PORT` | No | `3000` | Express server port. |
| `ADMIN_EMAIL` | No | `sujalv641@gmail.com` | Email auto-granted the `admin` role at signup/login. Any other email can only ever be `buyer`/`seller`. |
| `CLOUDINARY_CLOUD_NAME` | For uploads | — | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | For uploads | — | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | For uploads | — | Cloudinary API secret. |

`.env` and `.env.example` are git-ignored (root `.gitignore`); copy the example and fill in the values.

---

## Getting Started

### Prerequisites
- Node.js (v18+; backend dev uses `node --watch`)
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)

### Setup
```bash
# backend
cd backend
npm install
cp .env.example .env   # then fill in MONGO_URI, JWT_SECRET, Cloudinary keys, ADMIN_EMAIL

# frontend
cd ../frontend
npm install
```

### Run (Development)
```bash
# Terminal 1 — API on http://localhost:3000
cd backend
npm run dev

# Terminal 2 — Vite on http://localhost:5173 (proxies /api → :3000)
cd ../frontend
npm run dev
```

### Production
```bash
cd frontend
npm run build     # → frontend/dist (served by Express with SPA fallback)

cd ../backend
npm start         # Express serves API + static build
```

### Seed & Test (from `backend/`)
```bash
node scripts/seedCategories.js    # Seed 10 categories: Mobiles, Electronics, Vehicles,
                                  # Furniture, Fashion, Real Estate, Jobs, Services,
                                  # Books & Hobbies, Pets (idempotent upsert by slug)

node scripts/migrateRoles.js      # Backfill role:'buyer' for legacy users + grant 'admin'
                                  # to ADMIN_EMAIL (idempotent; run once after upgrading)

node scripts/testEndpoints.js     # Smoke tests (roles, orders, ownership) against http://localhost:3000/api
```

> **First admin:** set `ADMIN_EMAIL` in `.env`, then sign up with that exact email — the server grants it the `admin` role automatically (and repairs it on login).

---

## Design System

Dark glassmorphism theme defined in `frontend/src/styles/globals.css`:
- `--bg: #0b0f19` dark background, `--accent: #f43f5e` rose accent, indigo/slate palette, glass tokens, shadow/glow presets, Inter font.
- All prices rendered via `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.

---

## Key Fixes & Notes

- **Wishlist sync bug**: heart buttons on product cards previously toggled local state only, so favoriting from one page didn't reflect elsewhere. Fixed by introducing `FavoritesContext` (global provider wrapping the app) — all heart buttons read/write the shared wishlist with optimistic updates and toasts.
- **Role-based access control**: roles (`buyer`/`seller`/`admin`) are enforced server-side (`requireRole` + `authMiddleware`). Client signup can only request `buyer`/`seller`; `ADMIN_EMAIL` is granted `admin` automatically. Run `node scripts/migrateRoles.js` once after upgrading to backfill legacy users and promote the admin.
- **Server-authoritative orders**: checkout previously simulated success on the frontend; it now calls `POST /api/orders`, which re-fetches listing prices, enforces a 5% platform fee, and marks purchased listings `sold`.
- **Price input currency**: `CreateListing` and `EditListing` now take price in Indian Rupees (`IndianRupee` icon, label `Price`, placeholder `0`), replacing the earlier dollar-based input.
- Legacy static prototype preserved in `public/_legacy/` and `public/browse.html`; the current app is the React SPA.
- The `cors` package is listed in `backend/package.json` but unused (same-origin proxying via Vite).
