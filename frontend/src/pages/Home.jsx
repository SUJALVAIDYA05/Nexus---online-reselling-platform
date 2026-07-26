import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Package, Search, MessageCircle, Tag,
  Users, ShoppingBag, TrendingUp, ChevronRight, Zap, Shield, Star,
  Smartphone, Laptop, Home as HomeIcon, Shirt, Gamepad2, BookOpen, Dumbbell, Baby
} from 'lucide-react';
import { categories } from '../api/api';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';

const styles = `
  @keyframes heroFadeUp {
    from { opacity: 0; transform: translateY(32px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes floatSlow {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }
  @keyframes floatMedium {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes floatFast {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-16px); }
  }
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes gridPulse {
    0%, 100% { opacity: 0.03; }
    50% { opacity: 0.06; }
  }
  @keyframes orbFloat1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -30px) scale(1.05); }
    66% { transform: translate(-20px, 20px) scale(0.95); }
  }
  @keyframes orbFloat2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-40px, 20px) scale(0.95); }
    66% { transform: translate(20px, -30px) scale(1.05); }
  }

  .home-page { overflow: hidden; }

  .home-hero {
    position: relative;
    min-height: calc(100vh - var(--nav-height));
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 40%, var(--primary-lighter) 100%);
    overflow: hidden;
    padding: 80px 24px;
  }
  .hero-grid-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 64px 64px;
    animation: gridPulse 8s ease-in-out infinite;
    pointer-events: none;
  }
  .hero-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    pointer-events: none;
  }
  .hero-orb-1 {
    width: 600px;
    height: 600px;
    background: rgba(233, 69, 96, 0.12);
    top: -200px;
    right: -150px;
    animation: orbFloat1 14s ease-in-out infinite;
  }
  .hero-orb-2 {
    width: 500px;
    height: 500px;
    background: rgba(15, 52, 96, 0.25);
    bottom: -150px;
    left: -150px;
    animation: orbFloat2 16s ease-in-out infinite;
  }
  .hero-orb-3 {
    width: 250px;
    height: 250px;
    background: rgba(233, 69, 96, 0.08);
    top: 50%;
    left: 50%;
    animation: orbFloat1 10s ease-in-out infinite reverse;
  }
  .hero-content {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 800px;
  }
  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 22px;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-full);
    color: rgba(255, 255, 255, 0.75);
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 36px;
    backdrop-filter: blur(12px);
    animation: heroFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .hero-badge-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
    animation: pulse 2s ease-in-out infinite;
    box-shadow: 0 0 8px rgba(233, 69, 96, 0.5);
  }
  .hero-title {
    font-size: clamp(42px, 7vw, 76px);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -3px;
    color: #ffffff;
    margin-bottom: 28px;
    animation: heroFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
  }
  .hero-title-accent {
    background: linear-gradient(135deg, var(--accent) 0%, #ff6b81 50%, #ff9a76 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradientShift 4s ease-in-out infinite;
  }
  .hero-subtitle {
    font-size: clamp(16px, 2.2vw, 20px);
    color: rgba(255, 255, 255, 0.5);
    line-height: 1.75;
    max-width: 560px;
    margin: 0 auto 44px;
    animation: heroFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
  }
  .hero-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
    animation: heroFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
  }
  .hero-actions .btn-primary {
    background: linear-gradient(135deg, var(--accent) 0%, #ff6b81 100%);
    box-shadow: 0 4px 24px rgba(233, 69, 96, 0.4);
  }
  .hero-actions .btn-primary:hover {
    box-shadow: 0 8px 36px rgba(233, 69, 96, 0.55);
    transform: translateY(-2px);
  }
  .hero-actions .btn-secondary {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #ffffff;
    backdrop-filter: blur(8px);
  }
  .hero-actions .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.22);
  }
  .hero-stats-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 56px;
    margin-top: 72px;
    animation: heroFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
  }
  .hero-stat { text-align: center; }
  .hero-stat-value {
    font-size: 32px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.5px;
  }
  .hero-stat-label {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.35);
    margin-top: 6px;
    font-weight: 500;
  }
  .hero-stat-divider {
    width: 1px;
    height: 44px;
    background: rgba(255, 255, 255, 0.08);
  }
  .hero-floating-cards {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
  }
  .hero-float-card {
    position: absolute;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: var(--radius-lg);
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: rgba(255, 255, 255, 0.65);
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
  }
  .hero-float-card svg { color: var(--accent); flex-shrink: 0; }
  .hero-float-1 { top: 18%; left: 6%; animation: floatSlow 6s ease-in-out infinite; }
  .hero-float-2 { top: 28%; right: 5%; animation: floatMedium 5s ease-in-out infinite 0.5s; }
  .hero-float-3 { bottom: 22%; left: 8%; animation: floatFast 7s ease-in-out infinite 1s; }
  .hero-float-4 { bottom: 16%; right: 8%; animation: floatSlow 8s ease-in-out infinite 1.5s; }

  .home-section { padding: 100px 24px; }
  .home-section-alt { background: var(--bg-secondary); }
  .home-section-inner {
    max-width: var(--container);
    margin: 0 auto;
  }
  .section-header {
    text-align: center;
    margin-bottom: 60px;
  }
  .section-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 700;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 1.8px;
    margin-bottom: 18px;
  }
  .section-title {
    font-size: clamp(28px, 4vw, 42px);
    font-weight: 800;
    letter-spacing: -1.5px;
    color: var(--text);
    line-height: 1.15;
    margin-bottom: 18px;
  }
  .section-desc {
    font-size: 17px;
    color: var(--text-secondary);
    max-width: 520px;
    margin: 0 auto;
    line-height: 1.75;
  }

  .categories-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  .category-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-xl);
    padding: 32px 24px;
    text-align: center;
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-card);
  }
  .category-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--accent-light) 0%, transparent 60%);
    opacity: 0;
    transition: opacity var(--transition);
  }
  .category-card:hover {
    border-color: var(--accent);
    box-shadow: var(--shadow-card-hover), 0 0 0 1px var(--accent-light);
    transform: translateY(-5px);
  }
  .category-card:hover::before { opacity: 1; }
  .category-card-icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-lg);
    background: var(--accent-light);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 18px;
    color: var(--accent);
    position: relative;
    z-index: 1;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .category-card:hover .category-card-icon {
    background: var(--accent);
    color: #fff;
    transform: scale(1.1);
    box-shadow: 0 4px 16px rgba(233, 69, 96, 0.3);
  }
  .category-card-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
    position: relative;
    z-index: 1;
    letter-spacing: -0.01em;
  }
  .category-card-count {
    font-size: 12px;
    color: var(--text-tertiary);
    margin-top: 4px;
    position: relative;
    z-index: 1;
  }
  .categories-more { text-align: center; margin-top: 44px; }

  .steps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 40px;
    position: relative;
  }
  .steps-grid::before {
    content: '';
    position: absolute;
    top: 56px;
    left: calc(16.67% + 20px);
    right: calc(16.67% + 20px);
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--border), var(--accent), var(--border), transparent);
  }
  .step-card { text-align: center; position: relative; }
  .step-number-wrap {
    width: 116px;
    height: 116px;
    border-radius: 50%;
    margin: 0 auto 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .step-number-bg {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
    border: 2px solid var(--border-light);
  }
  .step-number-inner {
    position: relative;
    z-index: 1;
    width: 92px;
    height: 92px;
    border-radius: 50%;
    background: var(--bg-secondary);
    border: 2px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .step-card:hover .step-number-inner {
    border-color: var(--accent);
    background: var(--accent-light);
    transform: scale(1.08);
    box-shadow: 0 0 30px rgba(233, 69, 96, 0.15);
  }
  .step-number {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    box-shadow: 0 2px 8px rgba(233, 69, 96, 0.3);
  }
  .step-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 12px;
    letter-spacing: -0.3px;
  }
  .step-desc {
    font-size: 15px;
    color: var(--text-secondary);
    line-height: 1.7;
    max-width: 280px;
    margin: 0 auto;
  }

  .stats-banner {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 50%, var(--primary-lighter) 100%);
    padding: 88px 24px;
    position: relative;
    overflow: hidden;
  }
  .stats-banner-grid-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }
  .stats-banner-inner {
    position: relative;
    z-index: 1;
    max-width: var(--container);
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
  .stat-card {
    text-align: center;
    padding: 28px 24px;
    border-radius: var(--radius-xl);
    background: rgba(255, 255, 255, 0.035);
    border: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(8px);
    transition: all 0.3s ease;
  }
  .stat-card:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateY(-2px);
  }
  .stat-icon {
    width: 52px;
    height: 52px;
    border-radius: var(--radius-lg);
    background: rgba(233, 69, 96, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 18px;
    color: var(--accent);
  }
  .stat-value {
    font-size: 38px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -1px;
    line-height: 1.1;
  }
  .stat-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.4);
    margin-top: 8px;
    font-weight: 500;
  }

  .cta-banner {
    padding: 110px 24px;
    text-align: center;
    background: var(--bg);
    position: relative;
  }
  .cta-banner-inner {
    max-width: 640px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }
  .cta-title {
    font-size: clamp(30px, 4vw, 44px);
    font-weight: 800;
    letter-spacing: -1.5px;
    color: var(--text);
    margin-bottom: 18px;
    line-height: 1.12;
  }
  .cta-desc {
    font-size: 17px;
    color: var(--text-secondary);
    margin-bottom: 40px;
    line-height: 1.75;
  }
  .cta-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .cta-glow {
    position: absolute;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(233, 69, 96, 0.05) 0%, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  @media (max-width: 1024px) {
    .categories-grid { grid-template-columns: repeat(2, 1fr); }
    .steps-grid { grid-template-columns: 1fr; gap: 48px; }
    .steps-grid::before { display: none; }
    .stats-banner-inner { grid-template-columns: repeat(2, 1fr); }
    .hero-stats-row { gap: 32px; }
    .hero-float-card { display: none; }
  }
  @media (max-width: 640px) {
    .home-hero { padding: 48px 20px; min-height: auto; }
    .hero-stats-row { flex-direction: column; gap: 20px; }
    .hero-stat-divider { width: 40px; height: 1px; }
    .categories-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
    .category-card { padding: 24px 16px; }
    .stats-banner-inner { grid-template-columns: 1fr; }
    .home-section { padding: 64px 20px; }
    .stat-card { padding: 24px 16px; }
  }
`;

const categoryIcons = {
  'electronics': Smartphone,
  'phones': Smartphone,
  'laptops': Laptop,
  'computers': Laptop,
  'furniture': HomeIcon,
  'fashion': Shirt,
  'clothing': Shirt,
  'gaming': Gamepad2,
  'books': BookOpen,
  'sports': Dumbbell,
  'fitness': Dumbbell,
  'kids': Baby,
  'baby': Baby,
};

function getCategoryIcon(name) {
  if (!name) return Tag;
  const lower = name.toLowerCase();
  for (const [key, Icon] of Object.entries(categoryIcons)) {
    if (lower.includes(key)) return Icon;
  }
  return Tag;
}

export default function Home() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categories.list()
      .then((data) => {
        const arr = Array.isArray(data) ? data : data.categories || [];
        setCats(arr);
      })
      .catch(() => setCats([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div className="home-page">
        <section className="home-hero">
          <div className="hero-grid-overlay" />
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />

          <div className="hero-floating-cards">
            <div className="hero-float-card hero-float-1">
              <ShoppingBag size={16} />
              <span>10,000+ Listings</span>
            </div>
            <div className="hero-float-card hero-float-2">
              <Star size={16} />
              <span>4.9 Rating</span>
            </div>
            <div className="hero-float-card hero-float-3">
              <Shield size={16} />
              <span>Secure Transactions</span>
            </div>
            <div className="hero-float-card hero-float-4">
              <Zap size={16} />
              <span>Instant Connect</span>
            </div>
          </div>

          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Trusted by 5,000+ users across India
            </div>
            <h1 className="hero-title">
              Buy & Sell on<br />
              <span className="hero-title-accent">Nexus</span>
            </h1>
            <p className="hero-subtitle">
              The modern marketplace for buying and selling pre-owned goods.
              Discover incredible deals or turn your unused items into cash.
            </p>
            <div className="hero-actions">
              <Link to="/browse">
                <Button size="lg" icon={Search}>
                  Browse Listings
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary" size="lg" iconRight={ArrowRight}>
                  Start Selling
                </Button>
              </Link>
            </div>
            <div className="hero-stats-row">
              <div className="hero-stat">
                <div className="hero-stat-value">10K+</div>
                <div className="hero-stat-label">Active Listings</div>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <div className="hero-stat-value">5K+</div>
                <div className="hero-stat-label">Happy Users</div>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <div className="hero-stat-value">1K+</div>
                <div className="hero-stat-label">Verified Sellers</div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section home-section-alt">
          <div className="home-section-inner">
            <div className="section-header">
              <div className="section-label">
                <Tag size={14} />
                Categories
              </div>
              <h2 className="section-title">Explore What You Need</h2>
              <p className="section-desc">
                Find exactly what you're looking for across our curated categories
              </p>
            </div>

            {loading ? (
              <div className="categories-grid">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="category-card" style={{ opacity: 0.5 }}>
                    <div className="category-card-icon" style={{ background: 'var(--bg-tertiary)' }}>
                      <div className="skeleton" style={{ width: 24, height: 24, borderRadius: 6 }} />
                    </div>
                    <div className="skeleton" style={{ width: '60%', height: 16, margin: '0 auto 4px' }} />
                    <div className="skeleton" style={{ width: '40%', height: 12, margin: '0 auto' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="categories-grid">
                {cats.slice(0, 8).map((cat) => {
                  const IconComp = getCategoryIcon(cat.name);
                  return (
                    <Link
                      key={cat._id}
                      to={`/browse?category=${cat.slug || cat._id}`}
                      className="category-card"
                    >
                      <div className="category-card-icon">
                        <IconComp size={24} />
                      </div>
                      <div className="category-card-name">{cat.name}</div>
                    </Link>
                  );
                })}
              </div>
            )}

            {!loading && cats.length > 8 && (
              <div className="categories-more">
                <Link to="/browse">
                  <Button variant="ghost" iconRight={ChevronRight}>
                    View All Categories
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="home-section">
          <div className="home-section-inner">
            <div className="section-header">
              <div className="section-label">
                <Zap size={14} />
                How It Works
              </div>
              <h2 className="section-title">Three Steps to Start</h2>
              <p className="section-desc">
                Getting started on Nexus is simple. List, browse, and connect in minutes.
              </p>
            </div>

            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number-wrap">
                  <div className="step-number-bg" />
                  <div className="step-number-inner">
                    <Package size={32} />
                  </div>
                  <div className="step-number">1</div>
                </div>
                <h3 className="step-title">List Your Item</h3>
                <p className="step-desc">
                  Snap a photo, set your price, and publish your listing in under a minute. It's that simple.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number-wrap">
                  <div className="step-number-bg" />
                  <div className="step-number-inner">
                    <Search size={32} />
                  </div>
                  <div className="step-number">2</div>
                </div>
                <h3 className="step-title">Browse & Discover</h3>
                <p className="step-desc">
                  Explore thousands of listings from verified sellers near you. Filter by category, price, and condition.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number-wrap">
                  <div className="step-number-bg" />
                  <div className="step-number-inner">
                    <MessageCircle size={32} />
                  </div>
                  <div className="step-number">3</div>
                </div>
                <h3 className="step-title">Connect & Transact</h3>
                <p className="step-desc">
                  Message sellers directly, negotiate, and complete your purchase with confidence and security.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-banner">
          <div className="stats-banner-grid-overlay" />
          <div className="stats-banner-inner">
            <div className="stat-card">
              <div className="stat-icon">
                <ShoppingBag size={22} />
              </div>
              <div className="stat-value">10K+</div>
              <div className="stat-label">Active Listings</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Users size={22} />
              </div>
              <div className="stat-value">5K+</div>
              <div className="stat-label">Registered Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <TrendingUp size={22} />
              </div>
              <div className="stat-value">1K+</div>
              <div className="stat-label">Verified Sellers</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Star size={22} />
              </div>
              <div className="stat-value">4.9</div>
              <div className="stat-label">Average Rating</div>
            </div>
          </div>
        </section>

        <section className="cta-banner">
          <div className="cta-glow" />
          <div className="cta-banner-inner">
            <h2 className="cta-title">Ready to Start Selling?</h2>
            <p className="cta-desc">
              Join thousands of users who are already buying and selling on Nexus.
              Turn your unused items into cash today.
            </p>
            <div className="cta-actions">
              <Link to="/register">
                <Button size="lg" icon={Zap}>
                  Get Started Free
                </Button>
              </Link>
              <Link to="/browse">
                <Button variant="outline" size="lg" iconRight={ArrowRight}>
                  Explore Listings
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
