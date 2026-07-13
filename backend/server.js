require('dotenv').config();
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const connectDB = require('./db');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Exiting.');
  process.exit(1);
}

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- Helpers ---
function generateToken(user) {
  return jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
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
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email: rawEmail, password } = req.body;
    if (!name || !rawEmail || !password) return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const email = rawEmail.trim().toLowerCase();

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Password hashing is handled by the User model's pre-save hook
    const newUser = await User.create({ name, email, password });

    const user = { id: newUser._id, name: newUser.name, email: newUser.email };
    const token = generateToken(newUser);

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body;
    if (!rawEmail || !password) return res.status(400).json({ error: 'Email and password are required' });

    const email = rawEmail.trim().toLowerCase();
    const userDoc = await User.findOne({ email }).select('+password');
    if (!userDoc) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await userDoc.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const user = { id: userDoc._id, name: userDoc.name, email: userDoc.email };
    const token = generateToken(userDoc);

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ user, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me — protected
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email } });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// --- Serve HTML pages with proper routes ---
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'signup.html'));
});
app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'services.html'));
});
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'about.html'));
});
app.get('/testimonials', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'testimonials.html'));
});
app.get('/dashboard', (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.redirect('/login');
  try {
    jwt.verify(token, JWT_SECRET);
    res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
  } catch {
    res.redirect('/login');
  }
});

// --- Start ---
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
start();
