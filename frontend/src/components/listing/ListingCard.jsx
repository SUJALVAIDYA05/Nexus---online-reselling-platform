import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Heart } from 'lucide-react';
import './ListingCard.css';

const conditionColors = {
  'new': 'badge-success',
  'like-new': 'badge-info',
  'good': 'badge-warning',
  'fair': 'badge-default',
  'poor': 'badge-error',
};

export default function ListingCard({ listing, onFavorite, isFavorited }) {
  const formatPrice = (p) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

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
        <motion.button
          className={`listing-card-fav ${isFavorited ? 'favorited' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavorite?.(listing._id); }}
          whileTap={{ scale: 0.8 }}
          whileHover={{ scale: 1.15 }}
        >
          <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
        </motion.button>
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
