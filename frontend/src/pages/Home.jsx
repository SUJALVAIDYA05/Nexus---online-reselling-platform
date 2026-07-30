import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Package, Search, MessageCircle, Tag,
  ChevronRight, Zap, ShieldCheck, Sparkles, Star, TrendingUp,
  Smartphone, Laptop, Home as HomeIcon, Shirt, Gamepad2, BookOpen, Dumbbell, Baby
} from 'lucide-react';
import { categories, listings } from '../api/api';
import Button from '../components/ui/Button';
import ListingCard from '../components/listing/ListingCard';
import PageTransition from '../components/ui/PageTransition';

const styles = `
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

  .home-hero {
    position: relative;
    min-height: calc(88vh - var(--nav-height));
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at 50% 30%, #1e293b 0%, #0f172a 70%, #0b0f19 100%);
    overflow: hidden;
    padding: 90px 24px;
  }
  .hero-grid-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    pointer-events: none;
  }
  .hero-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(110px);
    pointer-events: none;
  }
  .hero-orb-1 {
    width: 600px;
    height: 600px;
    background: rgba(244, 63, 94, 0.18);
    top: -200px;
    right: -150px;
    animation: orbFloat1 14s ease-in-out infinite;
  }
  .hero-orb-2 {
    width: 550px;
    height: 550px;
    background: rgba(99, 102, 241, 0.22);
    bottom: -150px;
    left: -150px;
    animation: orbFloat2 16s ease-in-out infinite;
  }
  .hero-content {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 840px;
  }
  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    border-radius: var(--radius-full);
    background: rgba(244, 63, 94, 0.12);
    border: 1px solid rgba(244, 63, 94, 0.3);
    color: var(--accent);
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 24px;
    backdrop-filter: blur(8px);
  }
  .hero-title {
    font-size: clamp(44px, 7.5vw, 76px);
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -3px;
    color: #ffffff;
    margin-bottom: 28px;
  }
  .hero-title-accent {
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .hero-subtitle {
    font-size: clamp(16px, 2.2vw, 20px);
    color: var(--text-secondary);
    line-height: 1.75;
    max-width: 620px;
    margin: 0 auto 44px;
  }
  .hero-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .home-section { padding: 90px 24px; position: relative; }
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
    letter-spacing: 2px;
    margin-bottom: 16px;
  }
  .section-title {
    font-size: clamp(30px, 4.5vw, 44px);
    font-weight: 800;
    letter-spacing: -1.5px;
    color: #ffffff;
    line-height: 1.15;
    margin-bottom: 16px;
  }
  .section-desc {
    font-size: 17px;
    color: var(--text-secondary);
    max-width: 560px;
    margin: 0 auto;
    line-height: 1.75;
  }

  .categories-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  .category-card {
    background: var(--bg-glass);
    backdrop-filter: blur(16px);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 32px 24px;
    text-align: center;
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .category-card:hover {
    border-color: var(--accent);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4), 0 0 25px rgba(244, 63, 94, 0.25);
    transform: translateY(-6px);
  }
  .category-card-icon {
    width: 60px;
    height: 60px;
    border-radius: var(--radius-lg);
    background: rgba(244, 63, 94, 0.12);
    border: 1px solid rgba(244, 63, 94, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 18px;
    color: var(--accent);
    transition: all 0.3s ease;
  }
  .category-card:hover .category-card-icon {
    background: var(--gradient-primary);
    color: #ffffff;
    transform: scale(1.1) rotate(4deg);
    box-shadow: 0 6px 20px rgba(244, 63, 94, 0.45);
  }
  .category-card-name {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.01em;
  }

  .listings-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }

  .steps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 36px;
    position: relative;
  }
  .step-card {
    background: var(--bg-glass);
    backdrop-filter: blur(16px);
    border: 1px solid var(--border);
    border-radius: var(--radius-2xl);
    padding: 40px 28px;
    text-align: center;
    position: relative;
    transition: all 0.3s ease;
  }
  .step-card:hover {
    border-color: rgba(244, 63, 94, 0.35);
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
  }
  .step-icon-wrap {
    width: 72px;
    height: 72px;
    border-radius: 20px;
    background: var(--gradient-primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    box-shadow: 0 8px 24px rgba(244, 63, 94, 0.35);
  }
  .step-title {
    font-size: 20px;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 12px;
  }
  .step-desc {
    font-size: 15px;
    color: var(--text-secondary);
    line-height: 1.7;
  }

  .cta-banner {
    padding: 100px 24px;
    text-align: center;
    background: radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%);
    position: relative;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .cta-banner-inner {
    max-width: 680px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  @media (max-width: 1024px) {
    .categories-grid, .listings-grid { grid-template-columns: repeat(2, 1fr); }
    .steps-grid { grid-template-columns: 1fr; gap: 24px; }
  }
  @media (max-width: 640px) {
    .categories-grid, .listings-grid { grid-template-columns: 1fr; }
    .home-hero { padding: 60px 16px; }
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
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const excluded = ['jobs', 'real estate', 'pets'];

  useEffect(() => {
    Promise.all([
      categories.list().catch(() => []),
      listings.list({ limit: 4 }).catch(() => ({ listings: [] }))
    ]).then(([catData, listingData]) => {
      const arr = Array.isArray(catData) ? catData : catData?.categories || [];
      setCats(arr.filter(c => !excluded.includes(c.name?.toLowerCase())));
      const listArr = Array.isArray(listingData) ? listingData : listingData?.listings || [];
      setFeaturedListings(listArr);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <PageTransition>
      <style>{styles}</style>
      <div className="home-page">
        <section className="home-hero">
          <div className="hero-grid-overlay" />
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />

          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="hero-badge">
              <Sparkles size={15} /> Pre-Owned Market Reimagined
            </div>

            <h1 className="hero-title">
              Buy & Sell Smart on<br />
              <span className="hero-title-accent">Nexus Platform</span>
            </h1>

            <p className="hero-subtitle">
              The premier online reselling destination. Discover verified deals, 
              trade pre-loved goods, or turn your extra items into instant income today.
            </p>

            <div className="hero-actions">
              <Link to="/browse">
                <Button size="lg" icon={Search}>
                  Explore Browse
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary" size="lg" iconRight={ArrowRight}>
                  Start Selling
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="home-section home-section-alt">
          <div className="home-section-inner">
            <div className="section-header">
              <div className="section-label">
                <Tag size={14} /> Top Categories
              </div>
              <h2 className="section-title">Explore What You Need</h2>
              <p className="section-desc">
                Find incredible pre-owned treasures across our curated categories
              </p>
            </div>

            {loading ? (
              <div className="categories-grid">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="category-card skeleton" style={{ height: 160 }} />
                ))}
              </div>
            ) : (
              <motion.div 
                className="categories-grid"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-50px' }}
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.08 }
                  }
                }}
              >
                {cats.slice(0, 8).map((cat) => {
                  const IconComp = getCategoryIcon(cat.name);
                  return (
                    <motion.div
                      key={cat._id}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0 }
                      }}
                    >
                      <Link
                        to={`/browse?category=${cat.slug || cat._id}`}
                        className="category-card"
                      >
                        <div className="category-card-icon">
                          <IconComp size={26} />
                        </div>
                        <div className="category-card-name">{cat.name}</div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {!loading && cats.length > 8 && (
              <div style={{ textAlign: 'center', marginTop: 44 }}>
                <Link to="/browse">
                  <Button variant="ghost" iconRight={ChevronRight}>
                    View All Categories
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {featuredListings.length > 0 && (
          <section className="home-section">
            <div className="home-section-inner">
              <div className="section-header">
                <div className="section-label">
                  <TrendingUp size={14} /> Fresh Arrivals
                </div>
                <h2 className="section-title">Featured Marketplace Goods</h2>
                <p className="section-desc">
                  Hand-picked pre-owned items listed recently by top verified sellers
                </p>
              </div>

              <div className="listings-grid">
                {featuredListings.map((listing) => (
                  <ListingCard key={listing._id} listing={listing} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="home-section home-section-alt">
          <div className="home-section-inner">
            <div className="section-header">
              <div className="section-label">
                <ShieldCheck size={14} /> Seamless Process
              </div>
              <h2 className="section-title">Three Steps to Reselling Success</h2>
              <p className="section-desc">
                Getting started on Nexus is simple, secure, and lightning fast.
              </p>
            </div>

            <div className="steps-grid">
              <div className="step-card">
                <div className="step-icon-wrap">
                  <Package size={30} />
                </div>
                <h3 className="step-title">1. Post Your Items</h3>
                <p className="step-desc">
                  Snap photos, set your price, and publish your listing in under a minute with smart guidance.
                </p>
              </div>

              <div className="step-card">
                <div className="step-icon-wrap">
                  <Search size={30} />
                </div>
                <h3 className="step-title">2. Discover Verified Deals</h3>
                <p className="step-desc">
                  Explore pre-loved tech, fashion, and home goods with price transparency and instant search.
                </p>
              </div>

              <div className="step-card">
                <div className="step-icon-wrap">
                  <MessageCircle size={30} />
                </div>
                <h3 className="step-title">3. Direct Chat & Deal</h3>
                <p className="step-desc">
                  Chat directly with buyers or sellers, arrange safe delivery, and complete your purchase securely.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-banner">
          <div className="cta-banner-inner">
            <h2 className="section-title" style={{ marginBottom: 18 }}>Turn Extra Items Into Instant Cash</h2>
            <p className="section-desc" style={{ marginBottom: 36 }}>
              Join thousands of happy users buying and selling pre-owned items every day on Nexus.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register">
                <Button size="lg" icon={Zap}>
                  Get Started Now
                </Button>
              </Link>
              <Link to="/browse">
                <Button variant="secondary" size="lg" iconRight={ArrowRight}>
                  Explore Products
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
