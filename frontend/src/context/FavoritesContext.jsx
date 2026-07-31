import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { favorites } from '../api/api';

const FavoritesContext = createContext(null);

function extractListings(data) {
  const arr = Array.isArray(data) ? data : (data.favorites || []);
  return arr.filter(f => f.listing).map(f => f.listing);
}

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favIds, setFavIds] = useState(new Set());
  const [favoriteListings, setFavoriteListings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Favorites are a buyer/admin feature — sellers have no wishlist
    if (!user || user.role === 'seller') {
      setFavIds(new Set());
      setFavoriteListings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    favorites.list()
      .then(data => {
        if (cancelled) return;
        const listingsArr = extractListings(data);
        setFavoriteListings(listingsArr);
        setFavIds(new Set(listingsArr.map(l => l._id)));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  const isFavorited = useCallback((id) => favIds.has(id), [favIds]);

  const toggleFavorite = useCallback(async (id) => {
    const wasFav = favIds.has(id);
    setFavIds(prev => {
      const next = new Set(prev);
      if (wasFav) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      if (wasFav) {
        await favorites.remove(id);
        setFavoriteListings(prev => prev.filter(l => l._id !== id));
        toast.success('Removed from wishlist');
      } else {
        await favorites.add(id);
        const data = await favorites.list();
        const listingsArr = extractListings(data);
        setFavoriteListings(listingsArr);
        setFavIds(new Set(listingsArr.map(l => l._id)));
        toast.success('Added to wishlist');
      }
    } catch (err) {
      setFavIds(prev => {
        const next = new Set(prev);
        if (wasFav) next.add(id);
        else next.delete(id);
        return next;
      });
      toast.error(err?.message || 'Could not update wishlist');
    }
  }, [favIds]);

  return (
    <FavoritesContext.Provider value={{ favIds, favoriteListings, loading, isFavorited, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
