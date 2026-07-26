import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { favorites } from '../api/api';
import ListingCard from '../components/listing/ListingCard';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

export default function Favorites() {
  const { user } = useAuth();
  const [favListings, setFavListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const data = await favorites.list();
        const arr = Array.isArray(data) ? data : (data.favorites || []);
        setFavListings(arr.filter(f => f.listing).map(f => f.listing));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchFavorites();
  }, [user]);

  const handleRemove = useCallback(async (listingId) => {
    setRemovingId(listingId);
    try {
      await favorites.remove(listingId);
      setFavListings(prev => prev.filter(l => l._id !== listingId));
    } catch {
      // silent
    } finally {
      setRemovingId(null);
    }
  }, []);

  const handleFavorite = useCallback(async (listingId) => {
    await handleRemove(listingId);
  }, [handleRemove]);

  return (
    <div className="favorites-page">
      <header className="favorites-header">
        <div>
          <h1 className="favorites-title">
            <Heart size={26} className="favorites-title-icon" />
            My Wishlist
          </h1>
          <p className="favorites-subtitle">
            {!loading && `${favListings.length} item${favListings.length !== 1 ? 's' : ''} saved`}
          </p>
        </div>
      </header>

      {loading ? (
        <div className="favorites-loading">
          <Spinner size={36} />
          <p>Loading your wishlist...</p>
        </div>
      ) : favListings.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save items you love by tapping the heart icon. They'll show up here for easy access."
          action={
            <Link to="/browse">
              <Button icon={ArrowRight}>Browse Items</Button>
            </Link>
          }
        />
      ) : (
        <div className="favorites-grid">
          {favListings.map(listing => (
            <div key={listing._id} className="favorites-item">
              <ListingCard
                listing={listing}
                onFavorite={handleFavorite}
                isFavorited={true}
              />
              {removingId === listing._id && (
                <div className="favorites-removing">
                  <Spinner size={20} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .favorites-page {
          max-width: 100%;
          animation: fadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .favorites-header { margin-bottom: 32px; }
        .favorites-title {
          font-size: 28px; font-weight: 800; color: var(--text);
          margin: 0 0 6px; letter-spacing: -0.5px;
          display: flex; align-items: center; gap: 12px;
        }
        .favorites-title-icon { color: var(--accent); }
        .favorites-subtitle { font-size: 14px; color: var(--text-tertiary); margin: 0; }
        .favorites-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 72px; gap: 14px;
        }
        .favorites-loading p { color: var(--text-tertiary); font-size: 14px; }
        .favorites-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }
        .favorites-item { position: relative; }
        .favorites-removing {
          position: absolute; inset: 0; border-radius: var(--radius-xl);
          background: rgba(255,255,255,0.75); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 2;
        }
        @media (max-width: 600px) {
          .favorites-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
        }
      `}</style>
    </div>
  );
}
