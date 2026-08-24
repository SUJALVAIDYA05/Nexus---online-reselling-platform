require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./db');
const User = require('./models/User');
const { generateToken, authMiddleware } = require('./middleware/authMiddleware');
const errorHandler = require('./middleware/errorHandler');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');
const { signupRules, loginRules } = require('./middleware/validators');

// Route imports
const listingsRouter = require('./routes/listings');
const categoriesRouter = require('./routes/categories');
const favoritesRouter = require('./routes/favorites');
const usersRouter = require('./routes/users');
const uploadsRouter = require('./routes/uploads');
const conversationsRouter = require('./routes/messages');
const ordersRouter = require('./routes/orders');
const paymentsWebhookRouter = require('./routes/paymentsWebhook');
const { releaseExpiredReservations } = require('./utils/orderCleanup');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Exiting.');
  process.exit(1);
}

const cors = require('cors');

const isProduction = process.env.NODE_ENV === 'production';

// Trust the reverse proxy (Render, Railway, etc.) so that
// express-rate-limit sees real client IPs and secure cookies work.
if (isProduction) {
  app.set('trust proxy', 1);
}

// Allowed origins for CORS
const allowedOrigins = [
  'https://nexus-beige-chi.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      !isProduction
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true
}));

// The admin role is granted automatically ONLY when this email signs up/exists.
// It can never be chosen or assigned by a client request.
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'sujalv641@gmail.com').toLowerCase();

// --- Security & Core Middleware ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https:"],
      connectSrc: ["'self'", "https:", "http:"],
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Sanitize MongoDB operators from user input
app.use(mongoSanitize());

// Razorpay webhook requires exact raw request body for HMAC verification — must be registered before express.json()
app.use('/api/payments/webhook/razorpay', express.raw({ type: 'application/json' }), paymentsWebhookRouter);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply baseline rate limiting across all API routes
app.use('/api', apiLimiter);

// Serve static files (if built frontend / public dir exists)
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.use('/js', express.static(path.join(publicDir, '_legacy', 'js')));
}

// Cookie parser (lightweight, no extra dep)
app.use((req, res, next) => {
  const cookies = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(c => {
      const [k, v] = c.trim().split('=');
      cookies[k] = decodeURIComponent(v);
    });
  }
  req.cookies = cookies;
  next();
});

// --- Auth Routes ---

// POST /api/auth/signup
app.post('/api/auth/signup', authLimiter, signupRules, async (req, res, next) => {
  try {
    const { name, email: rawEmail, password, role } = req.body;

    const email = rawEmail.trim().toLowerCase();

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Client may only choose between 'buyer' and 'seller' — never 'admin'.
    // The admin email is granted the role automatically regardless of input.
    let assignedRole = role === 'seller' ? 'seller' : 'buyer';
    if (email === ADMIN_EMAIL) {
      assignedRole = 'admin';
    }

    // Password hashing is handled by the User model's pre-save hook
    const newUser = await User.create({ name, email, password, role: assignedRole });

    const user = {
      id: newUser._id.toString(),
      _id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    };
    const token = generateToken(newUser);

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
app.post('/api/auth/login', authLimiter, loginRules, async (req, res, next) => {
  try {
    const { email: rawEmail, password } = req.body;

    const email = rawEmail.trim().toLowerCase();
    const userDoc = await User.findOne({ email }).select('+password');
    if (!userDoc) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await userDoc.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    // Self-heal: if the admin email already exists (e.g. registered before
    // roles existed), ensure it always holds the admin role.
    if (email === ADMIN_EMAIL && userDoc.role !== 'admin') {
      userDoc.role = 'admin';
      await userDoc.save();
    }

    const user = {
      id: userDoc._id.toString(),
      _id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role
    };
    const token = generateToken(userDoc);

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — protected
app.get('/api/auth/me', authMiddleware, async (req, res, next) => {
  try {
    const userDoc = await User.findById(req.user.id);
    if (!userDoc) return res.status(404).json({ error: 'User not found' });
    const user = userDoc.toJSON();
    user.id = user._id.toString();
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
  res.json({ message: 'Logged out' });
});

// --- Health Check (used by Render / monitoring) ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- API Routers ---
app.use('/api/listings', listingsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/users', usersRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/orders', ordersRouter);

// --- Serve HTML pages with proper routes ---
// The original /browse page is preserved as-is per project constraints.
// All other pages are served by the React SPA if built locally, or fallback to API status.

// Keep the original browse page untouched (if public/browse.html exists)
app.get('/browse', (_req, res) => {
  const browsePath = path.join(__dirname, '..', 'public', 'browse.html');
  if (fs.existsSync(browsePath)) {
    return res.sendFile(browsePath);
  }
  const clientUrl = process.env.CLIENT_URL || 'https://nexus-beige-chi.vercel.app';
  res.redirect(`${clientUrl.replace(/\/+$/, '')}/browse`);
});

// --- Catch-all: serve SPA index.html if present, else return API status JSON ---
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  const indexPath = path.join(frontendDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.json({
    message: 'Nexus API backend is running',
    status: 'ok',
    health: '/api/health',
    client: process.env.CLIENT_URL || 'https://nexus-beige-chi.vercel.app'
  });
});

// --- Centralized error handler (must be last) ---
app.use(errorHandler);

// --- Start ---
async function start() {
  await connectDB();

  // Auto-seed default categories if database has none
  try {
    const Category = require('./models/Category');
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      const DEFAULT_CATEGORIES = [
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
      await Category.insertMany(DEFAULT_CATEGORIES);
      console.log('Seeded default categories into database');
    }
  } catch (seedErr) {
    console.error('Category auto-seed check failed:', seedErr.message);
  }

  // Run initial cleanup and set 60-second periodic interval for releasing expired UPI reservations
  releaseExpiredReservations();
  setInterval(releaseExpiredReservations, 60000);

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app;

