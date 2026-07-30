import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { favorites } from '../api/api';
import ListingCard from '../components/listing/ListingCard';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import PageTransition from '../components/ui/PageTransition';

export default function Favorites() {
  const { user } = useAuth();
  const [favListings, setFavListings] = useState([]);
  const [loading, setLoading] = useState(true);

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
    try {
      await favorites.remove(listingId);
      setFavListings(prev => prev.filter(l => l._id !== listingId));
    } catch {
      // silent
    }
  }, []);

  return (
    <PageTransition>
      <div className="fav-page">
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Heart size={28} color="var(--accent)" fill="var(--accent)" />
            Saved Wishlist
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>
            {!loading && `${favListings.length} ${favListings.length === 1 ? 'item' : 'items'} saved in your list`}
          </p>
        </header>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Spinner size={36} />
          </div>
        ) : favListings.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Explore products on Nexus and save your favorite pre-owned deals here."
            action={
              <Link to="/browse">
                <Button icon={ArrowRight}>Browse Items</Button>
              </Link>
            }
          />
        ) : (
          <motion.div 
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.05 } }
            }}
          >
            <AnimatePresence>
              {favListings.map(listing => (
                <motion.div
                  key={listing._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <ListingCard
                    listing={listing}
                    onFavorite={() => handleRemove(listing._id)}
                    isFavorited={true}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
