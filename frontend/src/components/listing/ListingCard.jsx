import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import './ListingCard.css';

const conditionColors = {
  'new': 'badge-success',
  'like-new': 'badge-info',
  'good': 'badge-warning',
  'fair': 'badge-default',
  'poor': 'badge-error',
};

export default function ListingCard({ listing, onFavorite, isFavorited }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorited: isFav, toggleFavorite } = useFavorites();

  const formatPrice = (p) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);
  const favorited = onFavorite ? !!isFavorited : isFav(listing._id);
  const isSeller = user?.role === 'seller';

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    if (onFavorite) onFavorite(listing._id);
    else toggleFavorite(listing._id);
  };

  return (
    <motion.div 
      className="listing-card glass-card"
      whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/listing/${listing._id}`} className="listing-card-image">
        {listing.images?.[0]?.url ? (
          <img src={listing.images[0].url} alt={listing.title} loading="lazy" />
        ) : (
          <div className="listing-card-placeholder">
            <span>No Image Available</span>
          </div>
        )}
        {listing.condition && (
          <span className={`listing-card-condition badge badge-sm ${conditionColors[listing.condition] || 'badge-default'}`}>
            {listing.condition}
          </span>
        )}
        {!isSeller && (
          <motion.button
            className={`listing-card-fav ${favorited ? 'favorited' : ''}`}
            onClick={handleFavorite}
            whileTap={{ scale: 0.8 }}
            whileHover={{ scale: 1.15 }}
          >
            <Heart size={16} fill={favorited ? 'currentColor' : 'none'} />
          </motion.button>
        )}
      </Link>

      <div className="listing-card-body">
        <Link to={`/listing/${listing._id}`} className="listing-card-title-link">
          <h3 className="listing-card-title">{listing.title}</h3>
        </Link>
        <p className="listing-card-price">{formatPrice(listing.price)}</p>
        <div className="listing-card-meta">
          {listing.location && (
            <span className="listing-card-location">
              <MapPin size={13} /> {listing.location}
            </span>
          )}
          {listing.category?.name && (
            <span className="listing-card-category">{listing.category.name}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
