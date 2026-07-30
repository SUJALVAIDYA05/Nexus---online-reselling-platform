import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Heart, ShoppingCart, MessageSquare,
  MapPin, Calendar, Tag, ChevronRight as BreadcrumbArrow,
  ArrowLeft, Share2, Shield, Package, User
} from 'lucide-react';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ListingCard from '../components/listing/ListingCard';
import PageTransition from '../components/ui/PageTransition';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { listings, favorites, conversations } from '../api/api';

const fmtPrice = (p) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(p);

const conditionMeta = {
  'new': { label: 'Brand New', color: 'var(--success)', bg: 'var(--success-bg)' },
  'like-new': { label: 'Like New', color: 'var(--info)', bg: 'var(--info-bg)' },
  'good': { label: 'Good', color: 'var(--warning)', bg: 'var(--warning-bg)' },
  'fair': { label: 'Fair', color: 'var(--text-tertiary)', bg: 'rgba(255,255,255,0.06)' },
  'poor': { label: 'Poor', color: 'var(--error)', bg: 'var(--error-bg)' },
};

function daysAgo(d) {
  const diff = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (diff === 0) return 'Listed today';
  if (diff === 1) return 'Listed yesterday';
  return `Listed ${diff} days ago`;
}

const styles = `
  .ld-page { padding: 40px 0 80px; }
  .ld-container { max-width: var(--container); margin: 0 auto; padding: 0 24px; }
  .ld-breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-tertiary); margin-bottom: 28px; }
  .ld-bc-link { color: var(--text-secondary); text-decoration: none; }
  .ld-bc-link:hover { color: #ffffff; }
  .ld-bc-sep { color: var(--text-tertiary); }
  .ld-bc-current { color: #ffffff; font-weight: 600; }

  .ld-layout { display: grid; grid-template-columns: 1fr 400px; gap: 40px; }
  .ld-gallery { position: relative; border-radius: var(--radius-2xl); overflow: hidden; background: var(--bg-glass); border: 1px solid var(--border); margin-bottom: 32px; }
  .ld-gallery-main { aspect-ratio: 16 / 10; position: relative; background: #070a12; display: flex; align-items: center; justify-content: center; }
  .ld-gallery-img { width: 100%; height: 100%; object-fit: contain; }
  .ld-gallery-btn { position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; border-radius: 50%; background: rgba(15,23,42,0.8); border: 1px solid var(--border); color: #ffffff; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(8px); }
  .ld-gallery-prev { left: 16px; }
  .ld-gallery-next { right: 16px; }
  .ld-thumbs { display: flex; gap: 12px; padding: 16px; background: rgba(0,0,0,0.2); overflow-x: auto; }
  .ld-thumb { width: 70px; height: 70px; border-radius: var(--radius-md); overflow: hidden; border: 2px solid transparent; background: #000; cursor: pointer; opacity: 0.6; transition: all 0.2s; flex-shrink: 0; }
  .ld-thumb-active { border-color: var(--accent); opacity: 1; transform: scale(1.05); }
  .ld-thumb img { width: 100%; height: 100%; object-fit: cover; }

  .ld-section { background: var(--bg-glass); border: 1px solid var(--border); border-radius: var(--radius-2xl); padding: 32px; backdrop-filter: blur(16px); }
  .ld-section-title { font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 16px; }
  .ld-description { color: var(--text-secondary); line-height: 1.8; font-size: 15px; }

  .ld-sidebar { display: flex; flex-direction: column; gap: 24px; }
  .ld-info-card { background: var(--bg-glass); border: 1px solid var(--border); border-radius: var(--radius-2xl); padding: 32px; backdrop-filter: blur(16px); }
  .ld-price { font-size: 34px; font-weight: 900; color: var(--accent); margin-bottom: 16px; display: block; }
  .ld-meta-row { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .ld-condition-badge { padding: 4px 14px; border-radius: var(--radius-full); font-size: 13px; font-weight: 700; border: 1px solid var(--border); }
  .ld-date { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-tertiary); }

  .ld-actions { display: flex; flex-direction: column; gap: 14px; margin-top: 24px; }
  .ld-seller-card { display: flex; align-items: center; gap: 16px; padding: 20px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-light); border-radius: var(--radius-xl); margin-top: 24px; }
  .ld-seller-avatar { width: 48px; height: 48px; border-radius: 50%; background: var(--gradient-primary); color: white; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 18px; }

  @media (max-width: 992px) {
    .ld-layout { grid-template-columns: 1fr; }
  }
`;

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem, items: cartItems } = useCart();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setNotFound(false);
      setListing(null);
      setActiveImg(0);
      try {
        const data = await listings.get(id);
        if (cancelled) return;
        setListing(data.listing || data);

        if (data.listing?.category?._id || data.listing?.category) {
          const catId = typeof data.listing.category === 'object'
            ? data.listing.category._id
            : data.listing.category;
          listings.list({ category: catId, limit: 4 }).then(res => {
            if (!cancelled) setSimilar((res.listings || []).filter(l => l._id !== id));
          }).catch(() => {});
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!listing || !user) return;
    favorites.list().then(data => {
      const favs = data.favorites || data;
      setIsFavorited(favs.some(f => {
        const lid = typeof f.listing === 'object' ? f.listing._id : f.listing;
        return lid === listing._id;
      }));
    }).catch(() => {});
  }, [listing, user]);

  const handleFavorite = useCallback(async () => {
    if (!user) { navigate('/login'); return; }
    setFavLoading(true);
    try {
      if (isFavorited) {
        await favorites.remove(listing._id);
        setIsFavorited(false);
        toast.success('Removed from wishlist');
      } else {
        await favorites.add(listing._id);
        setIsFavorited(true);
        toast.success('Added to wishlist');
      }
    } catch { /* ignore */ }
    setFavLoading(false);
  }, [user, isFavorited, listing, navigate]);

  const handleAddToCart = useCallback(() => {
    if (!user) { navigate('/login'); return; }
    addItem(listing);
    setCartAdded(true);
    toast.success('Added to shopping cart!');
    setTimeout(() => setCartAdded(false), 2500);
  }, [user, addItem, listing, navigate]);

  const handleMessageSeller = useCallback(async () => {
    if (!user) { navigate('/login'); return; }
    const sellerId = listing?.seller?._id || listing?.seller;
    const currentUserId = user?.id || user?._id;
    if (sellerId === currentUserId) {
      toast.error('You cannot message yourself');
      return;
    }
    try {
      const convo = await conversations.create(listing._id);
      navigate(`/messages?convo=${convo._id}`);
    } catch (err) {
      toast.error(err?.message || 'Failed to start conversation');
    }
  }, [user, listing, navigate]);

  const images = listing?.images || [];
  const condition = conditionMeta[listing?.condition] || conditionMeta['fair'];
  const inCart = listing ? cartItems.some(i => i._id === listing._id) : false;

  if (loading) return <PageLoader />;
  if (notFound || !listing) {
    return (
      <PageTransition>
        <style>{styles}</style>
        <div className="ld-page">
          <div className="ld-container">
            <EmptyState
              icon={Package}
              title="Listing not found"
              description="This listing may have been removed or is no longer available."
              action={<Button onClick={() => navigate('/browse')} icon={ArrowLeft}>Back to Browse</Button>}
            />
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <style>{styles}</style>
      <div className="ld-page">
        <div className="ld-container">
          <nav className="ld-breadcrumb">
            <Link to="/" className="ld-bc-link">Home</Link>
            <BreadcrumbArrow size={14} className="ld-bc-sep" />
            <Link to="/browse" className="ld-bc-link">Browse</Link>
            <BreadcrumbArrow size={14} className="ld-bc-sep" />
            <span className="ld-bc-current">{listing.title}</span>
          </nav>

          <div className="ld-layout">
            <div className="ld-main">
              <div className="ld-gallery">
                {images.length > 0 ? (
                  <>
                    <div className="ld-gallery-main">
                      <motion.img
                        key={activeImg}
                        src={images[activeImg]?.url}
                        alt={listing.title}
                        className="ld-gallery-img"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      {images.length > 1 && (
                        <>
                          <button className="ld-gallery-btn ld-gallery-prev" onClick={() => setActiveImg(i => i === 0 ? images.length - 1 : i - 1)}>
                            <ChevronLeft size={20} />
                          </button>
                          <button className="ld-gallery-btn ld-gallery-next" onClick={() => setActiveImg(i => i === images.length - 1 ? 0 : i + 1)}>
                            <ChevronRight size={20} />
                          </button>
                        </>
                      )}
                    </div>
                    {images.length > 1 && (
                      <div className="ld-thumbs">
                        {images.map((img, i) => (
                          <button
                            key={i}
                            className={`ld-thumb ${i === activeImg ? 'ld-thumb-active' : ''}`}
                            onClick={() => setActiveImg(i)}
                          >
                            <img src={img.url} alt={`View ${i + 1}`} />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="ld-gallery-main" style={{ color: 'var(--text-tertiary)' }}>
                    No images uploaded
                  </div>
                )}
              </div>

              <div className="ld-section">
                <h2 className="ld-section-title">Item Description</h2>
                <div className="ld-description">
                  {listing.description?.split('\n').map((p, i) => <p key={i} style={{ marginBottom: 12 }}>{p}</p>)}
                </div>
              </div>
            </div>

            <div className="ld-sidebar">
              <div className="ld-info-card">
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', marginBottom: 12 }}>{listing.title}</h1>
                <span className="ld-price">{fmtPrice(listing.price)}</span>

                <div className="ld-meta-row">
                  {listing.condition && (
                    <span className="ld-condition-badge" style={{ color: condition.color, background: condition.bg }}>
                      {condition.label}
                    </span>
                  )}
                  <span className="ld-date">
                    <Calendar size={14} /> {daysAgo(listing.createdAt)}
                  </span>
                </div>

                {listing.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
                    <MapPin size={16} /> {listing.location}
                  </div>
                )}

                <div className="ld-actions">
                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    icon={ShoppingCart}
                    onClick={handleAddToCart}
                    disabled={inCart}
                  >
                    {cartAdded ? 'Added to Cart!' : inCart ? 'Already in Cart' : 'Add to Shopping Cart'}
                  </Button>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <Button
                      variant="secondary"
                      fullWidth
                      icon={MessageSquare}
                      onClick={handleMessageSeller}
                    >
                      Chat Seller
                    </Button>
                    <Button
                      variant={isFavorited ? 'outline' : 'secondary'}
                      icon={Heart}
                      onClick={handleFavorite}
                      disabled={favLoading}
                      title="Save Item"
                    />
                  </div>
                </div>

                {listing.seller && (
                  <div className="ld-seller-card">
                    <div className="ld-seller-avatar">
                      {listing.seller.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#ffffff', fontSize: 15 }}>{listing.seller.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Verified Seller</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
