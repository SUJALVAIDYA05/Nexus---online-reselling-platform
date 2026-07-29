import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ChevronLeft, ChevronRight, Heart, ShoppingCart, MessageSquare,
  MapPin, Calendar, Tag, ChevronRight as BreadcrumbArrow,
  ArrowLeft, Share2, Shield, Package, Star, AlertCircle,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardBody } from '../components/ui/Card';
import Spinner, { PageLoader } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ListingCard from '../components/listing/ListingCard';
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
  'fair': { label: 'Fair', color: 'var(--text-tertiary)', bg: 'var(--bg-tertiary)' },
  'poor': { label: 'Poor', color: 'var(--error)', bg: 'var(--error-bg)' },
};

function formatDate(d) {
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function daysAgo(d) {
  const diff = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (diff === 0) return 'Listed today';
  if (diff === 1) return 'Listed yesterday';
  return `Listed ${diff} days ago`;
}

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
  const [similarLoading, setSimilarLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setNotFound(false);
      setListing(null);
      setActiveImg(0);
      setCartAdded(false);
      try {
        const data = await listings.get(id);
        if (cancelled) return;
        setListing(data.listing || data);

        if (data.listing?.category?._id || data.listing?.category) {
          const catId = typeof data.listing.category === 'object'
            ? data.listing.category._id
            : data.listing.category;
          setSimilarLoading(true);
          try {
            const res = await listings.list({ category: catId, limit: 4 });
            if (!cancelled) {
              setSimilar((res.listings || []).filter(l => l._id !== id));
            }
          } catch { /* ignore */ }
          if (!cancelled) setSimilarLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        if (err?.status === 404) setNotFound(true);
        else setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!listing || !user) return;
    let cancelled = false;
    favorites.list().then(data => {
      if (!cancelled) {
        const favs = data.favorites || data;
        setIsFavorited(favs.some(f => {
          const lid = typeof f.listing === 'object' ? f.listing._id : f.listing;
          return lid === listing._id;
        }));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [listing, user]);

  const handleFavorite = useCallback(async () => {
    if (!user) { navigate('/login'); return; }
    setFavLoading(true);
    try {
      if (isFavorited) {
        await favorites.remove(listing._id);
        setIsFavorited(false);
      } else {
        await favorites.add(listing._id);
        setIsFavorited(true);
      }
    } catch { /* ignore */ }
    setFavLoading(false);
  }, [user, isFavorited, listing, navigate]);

  const handleAddToCart = useCallback(() => {
    if (!user) { navigate('/login'); return; }
    addItem(listing);
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2500);
  }, [user, addItem, listing, navigate]);

  const [msgLoading, setMsgLoading] = useState(false);

  const handleMessageSeller = useCallback(async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const sellerId = listing?.seller?._id || listing?.seller;
    const currentUserId = user?.id || user?._id;
    if (sellerId === currentUserId) {
      toast.error('You cannot message yourself');
      return;
    }
    setMsgLoading(true);
    try {
      const convo = await conversations.create(listing._id);
      navigate(`/messages?convo=${convo._id}`);
    } catch (err) {
      toast.error(err?.message || 'Failed to start conversation');
    } finally {
      setMsgLoading(false);
    }
  }, [user, listing, navigate]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: listing.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }, [listing]);

  const prevImg = () => {
    if (!listing?.images?.length) return;
    setActiveImg(i => (i === 0 ? listing.images.length - 1 : i - 1));
  };

  const nextImg = () => {
    if (!listing?.images?.length) return;
    setActiveImg(i => (i === listing.images.length - 1 ? 0 : i + 1));
  };

  const images = listing?.images || [];
  const condition = conditionMeta[listing?.condition] || conditionMeta['fair'];
  const inCart = listing ? cartItems.some(i => i._id === listing._id) : false;

  if (loading) return <PageLoader />;
  if (notFound) {
    return (
      <div className="ld-page">
        <div className="ld-container">
          <EmptyState
            icon={Package}
            title="Listing not found"
            description="This listing may have been removed or the link is invalid."
            action={<Button onClick={() => navigate('/')} icon={ArrowLeft}>Back to Home</Button>}
          />
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="ld-page">
      <div className="ld-container">
        <nav className="ld-breadcrumb">
          <Link to="/" className="ld-bc-link">Home</Link>
          <BreadcrumbArrow size={14} className="ld-bc-sep" />
          <Link to="/search" className="ld-bc-link">Browse</Link>
          {listing.category && (
            <>
              <BreadcrumbArrow size={14} className="ld-bc-sep" />
              <Link to={`/search?category=${listing.category.slug || listing.category._id}`} className="ld-bc-link">
                {listing.category.name}
              </Link>
            </>
          )}
          <BreadcrumbArrow size={14} className="ld-bc-sep" />
          <span className="ld-bc-current">{listing.title.length > 30 ? listing.title.slice(0, 30) + '…' : listing.title}</span>
        </nav>

        <div className="ld-layout">
          <div className="ld-main">
            <div className="ld-gallery">
              {images.length > 0 ? (
                <>
                  <div className="ld-gallery-main" onClick={() => setLightboxOpen(true)}>
                    <img
                      src={images[activeImg]?.url}
                      alt={listing.title}
                      className="ld-gallery-img"
                    />
                    {images.length > 1 && (
                      <>
                        <button className="ld-gallery-btn ld-gallery-prev" onClick={(e) => { e.stopPropagation(); prevImg(); }}>
                          <ChevronLeft size={20} />
                        </button>
                        <button className="ld-gallery-btn ld-gallery-next" onClick={(e) => { e.stopPropagation(); nextImg(); }}>
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}
                    <span className="ld-gallery-count">{activeImg + 1} / {images.length}</span>
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
                <div className="ld-gallery-empty">
                  <Package size={48} strokeWidth={1} />
                  <span>No images available</span>
                </div>
              )}
            </div>

            <div className="ld-section">
              <h2 className="ld-section-title">Description</h2>
              <div className="ld-description">
                {listing.description?.split('\n').map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </div>
          </div>

          <div className="ld-sidebar">
            <div className="ld-info-card">
              <div className="ld-price-row">
                <span className="ld-price">{fmtPrice(listing.price)}</span>
              </div>

              <div className="ld-meta-row">
                {listing.condition && (
                  <span className="ld-condition-badge" style={{ color: condition.color, background: condition.bg }}>
                    {condition.label}
                  </span>
                )}
                <span className="ld-date">
                  <Calendar size={13} />
                  {daysAgo(listing.createdAt)}
                </span>
              </div>

              <div className="ld-actions">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  icon={ShoppingCart}
                  onClick={handleAddToCart}
                  disabled={inCart}
                >
                  {cartAdded ? 'Added to Cart!' : inCart ? 'Already in Cart' : 'Add to Cart'}
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  size="lg"
                  icon={MessageSquare}
                  onClick={handleMessageSeller}
                  loading={msgLoading}
                  disabled={user && ((listing?.seller?._id || listing?.seller) === (user?.id || user?._id))}
                >
                  {user && ((listing?.seller?._id || listing?.seller) === (user?.id || user?._id)) ? 'Your Listing' : 'Message Seller'}
                </Button>
                <div className="ld-secondary-actions">
                  <Button
                    variant={isFavorited ? 'primary' : 'ghost'}
                    size="md"
                    icon={Heart}
                    onClick={handleFavorite}
                    loading={favLoading}
                  >
                    {isFavorited ? 'Wishlisted' : 'Wishlist'}
                  </Button>
                  <Button variant="ghost" size="md" icon={Share2} onClick={handleShare}>
                    Share
                  </Button>
                </div>
              </div>

              <div className="ld-details-grid">
                {listing.category && (
                  <div className="ld-detail-item">
                    <Tag size={15} className="ld-detail-icon" />
                    <div>
                      <span className="ld-detail-label">Category</span>
                      <span className="ld-detail-value">{listing.category.name}</span>
                    </div>
                  </div>
                )}
                {listing.location && (
                  <div className="ld-detail-item">
                    <MapPin size={15} className="ld-detail-icon" />
                    <div>
                      <span className="ld-detail-label">Location</span>
                      <span className="ld-detail-value">{listing.location}</span>
                    </div>
                  </div>
                )}
                {listing.condition && (
                  <div className="ld-detail-item">
                    <Shield size={15} className="ld-detail-icon" />
                    <div>
                      <span className="ld-detail-label">Condition</span>
                      <span className="ld-detail-value">{condition.label}</span>
                    </div>
                  </div>
                )}
                {listing.createdAt && (
                  <div className="ld-detail-item">
                    <Calendar size={15} className="ld-detail-icon" />
                    <div>
                      <span className="ld-detail-label">Listed</span>
                      <span className="ld-detail-value">{formatDate(listing.createdAt)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {listing.seller && (
              <div className="ld-seller-card">
                <div className="ld-seller-header">
                  <div className="ld-seller-avatar">
                    {listing.seller.avatarUrl ? (
                      <img src={listing.seller.avatarUrl} alt={listing.seller.name} />
                    ) : (
                      <span>{listing.seller.name?.charAt(0)?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="ld-seller-info">
                    <span className="ld-seller-name">{listing.seller.name}</span>
                    <span className="ld-seller-label">Seller</span>
                  </div>
                </div>
                <div className="ld-seller-stats">
                  <div className="ld-seller-stat">
                    <Star size={14} />
                    <span>Verified Seller</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {similar.length > 0 && (
          <div className="ld-similar">
            <h2 className="ld-section-title">Similar Listings</h2>
            <div className="ld-similar-grid">
              {similar.map(l => (
                <ListingCard key={l._id} listing={l} />
              ))}
            </div>
          </div>
        )}

        {lightboxOpen && images.length > 0 && (
          <div className="ld-lightbox" onClick={() => setLightboxOpen(false)}>
            <div className="ld-lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button className="ld-lightbox-close" onClick={() => setLightboxOpen(false)}>
                ✕
              </button>
              <button className="ld-lightbox-btn ld-lightbox-prev" onClick={prevImg}>
                <ChevronLeft size={28} />
              </button>
              <img src={images[activeImg]?.url} alt={listing.title} className="ld-lightbox-img" />
              <button className="ld-lightbox-btn ld-lightbox-next" onClick={nextImg}>
                <ChevronRight size={28} />
              </button>
              <div className="ld-lightbox-counter">{activeImg + 1} of {images.length}</div>
            </div>
          </div>
        )}
      </div>
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .ld-page { animation: fadeIn 0.4s ease; }
  .ld-container { max-width: var(--container); margin: 0 auto; padding: 0 24px 80px; }

  .ld-breadcrumb {
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
    padding: 24px 0 20px; font-size: 13px;
  }
  .ld-bc-link {
    color: var(--text-tertiary); transition: color var(--transition); text-decoration: none;
  }
  .ld-bc-link:hover { color: var(--accent); }
  .ld-bc-sep { color: var(--border); flex-shrink: 0; }
  .ld-bc-current { color: var(--text-secondary); font-weight: 500; }

  .ld-layout {
    display: grid; grid-template-columns: 1fr 420px; gap: 40px; align-items: start;
  }
  @media (max-width: 960px) {
    .ld-layout { grid-template-columns: 1fr; gap: 28px; }
  }

  .ld-gallery { position: relative; }
  .ld-gallery-main {
    position: relative; width: 100%; aspect-ratio: 4/3;
    border-radius: var(--radius-xl); overflow: hidden; background: var(--bg-tertiary);
    cursor: zoom-in;
    box-shadow: var(--shadow-card);
  }
  .ld-gallery-img {
    width: 100%; height: 100%; object-fit: cover;
    transition: opacity 0.3s ease, transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .ld-gallery-main:hover .ld-gallery-img { transform: scale(1.02); }
  .ld-gallery-btn {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 44px; height: 44px; border-radius: var(--radius-full);
    background: rgba(255,255,255,0.85); backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    color: var(--text); transition: all var(--transition);
    border: none; cursor: pointer; box-shadow: var(--shadow-md);
  }
  .ld-gallery-btn:hover { background: white; box-shadow: var(--shadow-lg); transform: translateY(-50%) scale(1.06); }
  .ld-gallery-prev { left: 14px; }
  .ld-gallery-next { right: 14px; }
  .ld-gallery-count {
    position: absolute; bottom: 14px; right: 14px;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
    color: white; font-size: 12px; font-weight: 600;
    padding: 5px 12px; border-radius: var(--radius-full);
  }
  .ld-thumbs {
    display: flex; gap: 10px; margin-top: 14px; overflow-x: auto;
    padding-bottom: 4px; scrollbar-width: thin;
  }
  .ld-thumb {
    flex-shrink: 0; width: 76px; height: 60px;
    border-radius: var(--radius-md); overflow: hidden;
    border: 2px solid transparent; cursor: pointer;
    transition: all var(--transition); padding: 0; background: none;
  }
  .ld-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .ld-thumb:hover { border-color: var(--border); }
  .ld-thumb-active { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-light); }
  .ld-gallery-empty {
    width: 100%; aspect-ratio: 4/3; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 12px;
    color: var(--text-tertiary); border-radius: var(--radius-xl);
    background: var(--bg-tertiary);
  }

  .ld-section { margin-top: 32px; }
  .ld-section-title {
    font-size: 19px; font-weight: 700; color: var(--text);
    margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border-light);
    letter-spacing: -0.2px;
  }
  .ld-description { font-size: 15px; line-height: 1.8; color: var(--text-secondary); }
  .ld-description p { margin-bottom: 14px; }
  .ld-description p:last-child { margin-bottom: 0; }

  .ld-sidebar {
    display: flex; flex-direction: column; gap: 18px; position: sticky; top: calc(var(--nav-height, 72px) + 24px);
  }

  .ld-info-card {
    background: var(--bg-secondary); border: 1px solid var(--border-light);
    border-radius: var(--radius-xl); padding: 28px;
    box-shadow: var(--shadow-card);
  }
  .ld-price-row { margin-bottom: 14px; }
  .ld-price {
    font-size: 34px; font-weight: 800; color: var(--accent);
    letter-spacing: -0.8px; line-height: 1;
  }

  .ld-meta-row {
    display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .ld-condition-badge {
    font-size: 12px; font-weight: 700; text-transform: capitalize;
    padding: 5px 14px; border-radius: var(--radius-full); letter-spacing: 0.3px;
  }
  .ld-date {
    display: flex; align-items: center; gap: 5px;
    font-size: 13px; color: var(--text-tertiary);
  }

  .ld-actions { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
  .ld-secondary-actions { display: flex; gap: 10px; }
  .ld-secondary-actions > button { flex: 1; }

  .ld-details-grid { display: flex; flex-direction: column; gap: 16px; padding-top: 20px; border-top: 1px solid var(--border-light); }
  .ld-detail-item { display: flex; align-items: flex-start; gap: 12px; }
  .ld-detail-icon { color: var(--text-tertiary); margin-top: 2px; flex-shrink: 0; }
  .ld-detail-label { display: block; font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.6px; }
  .ld-detail-value { display: block; font-size: 14px; font-weight: 600; color: var(--text); margin-top: 2px; }

  .ld-seller-card {
    background: var(--bg-secondary); border: 1px solid var(--border-light);
    border-radius: var(--radius-xl); padding: 24px; box-shadow: var(--shadow-card);
  }
  .ld-seller-header { display: flex; align-items: center; gap: 14px; }
  .ld-seller-avatar {
    width: 52px; height: 52px; border-radius: var(--radius-xl);
    background: var(--gradient-dark); color: white; display: flex;
    align-items: center; justify-content: center; font-size: 18px;
    font-weight: 700; overflow: hidden; flex-shrink: 0;
    box-shadow: var(--shadow-sm);
  }
  .ld-seller-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .ld-seller-info { display: flex; flex-direction: column; }
  .ld-seller-name { font-size: 15px; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
  .ld-seller-label { font-size: 12px; color: var(--text-tertiary); }
  .ld-seller-stats {
    margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border-light);
  }
  .ld-seller-stat {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; color: var(--text-secondary);
  }
  .ld-seller-stat svg { color: var(--warning); }

  .ld-similar { margin-top: 56px; }
  .ld-similar-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;
  }
  @media (max-width: 1024px) {
    .ld-similar-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 540px) {
    .ld-similar-grid { grid-template-columns: 1fr; }
  }

  .ld-lightbox {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.94); display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.2s ease;
  }
  .ld-lightbox-content {
    position: relative; display: flex; align-items: center; justify-content: center;
    width: 100%; height: 100%;
  }
  .ld-lightbox-img {
    max-width: 90vw; max-height: 85vh; object-fit: contain; border-radius: var(--radius-md);
    animation: scaleIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .ld-lightbox-close {
    position: absolute; top: 24px; right: 24px; z-index: 10;
    width: 44px; height: 44px; border-radius: var(--radius-full);
    background: rgba(255,255,255,0.12); backdrop-filter: blur(8px);
    color: white;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; border: none; cursor: pointer;
    transition: all var(--transition);
  }
  .ld-lightbox-close:hover { background: rgba(255,255,255,0.25); transform: scale(1.06); }
  .ld-lightbox-btn {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 52px; height: 52px; border-radius: var(--radius-full);
    background: rgba(255,255,255,0.1); backdrop-filter: blur(8px);
    color: white;
    display: flex; align-items: center; justify-content: center;
    border: none; cursor: pointer; transition: all var(--transition);
  }
  .ld-lightbox-btn:hover { background: rgba(255,255,255,0.22); transform: translateY(-50%) scale(1.06); }
  .ld-lightbox-prev { left: 24px; }
  .ld-lightbox-next { right: 24px; }
  .ld-lightbox-counter {
    position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
    color: rgba(255,255,255,0.6); font-size: 14px; font-weight: 500;
  }

  @media (max-width: 640px) {
    .ld-container { padding: 0 16px 48px; }
    .ld-price { font-size: 28px; }
    .ld-gallery-main { aspect-ratio: 1; border-radius: var(--radius-lg); }
    .ld-info-card { padding: 20px; }
    .ld-gallery-btn { width: 38px; height: 38px; }
    .ld-lightbox-prev { left: 12px; }
    .ld-lightbox-next { right: 12px; }
    .ld-lightbox-btn { width: 42px; height: 42px; }
  }
`;
