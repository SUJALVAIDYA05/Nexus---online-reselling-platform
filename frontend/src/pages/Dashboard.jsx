import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package, Heart, MessageCircle, TrendingUp, Users, ShoppingBag,
  PlusCircle, Search, ArrowUpRight, Calendar, Receipt
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { listings, users, orders } from '../api/api';
import Button from '../components/ui/Button';
import ListingCard from '../components/listing/ListingCard';
import PageTransition from '../components/ui/PageTransition';

const styles = `
  .db-page { padding: 32px 0 60px; }
  .db-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
  .db-welcome { font-size: 28px; font-weight: 800; color: #ffffff; margin-bottom: 4px; }
  .db-date { color: var(--text-tertiary); font-size: 13px; display: flex; align-items: center; gap: 6px; }

  .db-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
  .stat-card { background: var(--bg-glass); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 24px; display: flex; align-items: center; gap: 16px; }
  .stat-icon { width: 48px; height: 48px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .stat-val { font-size: 26px; font-weight: 900; color: #ffffff; line-height: 1.1; }
  .stat-label { font-size: 13px; color: var(--text-secondary); }

  .db-section { margin-bottom: 40px; }
  .db-sec-title { font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }

  .quick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .quick-card { background: var(--bg-glass); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 24px; display: flex; align-items: center; gap: 16px; text-decoration: none; color: #ffffff; transition: all 0.2s; }
  .quick-card:hover { border-color: var(--accent); transform: translateY(-3px); }

  @media (max-width: 992px) {
    .db-stats { grid-template-columns: repeat(2, 1fr); }
    .quick-grid { grid-template-columns: 1fr; }
  }
`;

export default function Dashboard() {
  const { user } = useAuth();
  const { favoriteListings } = useFavorites();
  const [myListings, setMyListings] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [activeListingsTotal, setActiveListingsTotal] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const role = user?.role;
  const canSell = role === 'seller' || role === 'admin';
  const isAdmin = role === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const recentRes = await listings.list({ limit: 4 });
        setRecentListings(recentRes.listings || []);
        setActiveListingsTotal(recentRes.total || 0);

        if (canSell) {
          const myRes = await users.getListings(user.id || user._id).catch(() => []);
          setMyListings(Array.isArray(myRes) ? myRes : (myRes.listings || []));
        }
        const orderRes = await orders.list({ limit: 1 }).catch(() => null);
        setOrderCount(orderRes?.total || 0);
        if (isAdmin) {
          const usersRes = await users.list({ limit: 1 }).catch(() => null);
          setUserCount(usersRes?.total || 0);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user, canSell, isAdmin]);

  const activeListings = myListings.filter(l => l.status === 'active');
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  let stats = [];
  if (isAdmin) {
    stats = [
      { label: 'Total Users', value: userCount, icon: Users, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
      { label: 'Active Listings', value: activeListingsTotal, icon: Package, color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
      { label: 'Total Orders', value: orderCount, icon: Receipt, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
      { label: 'Chat Inquiries', value: 0, icon: MessageCircle, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    ];
  } else if (role === 'seller') {
    stats = [
      { label: 'My Listings', value: myListings.length, icon: Package, color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
      { label: 'Active Deals', value: activeListings.length, icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
      { label: 'Total Sales', value: orderCount, icon: Receipt, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
      { label: 'Chat Inquiries', value: 0, icon: MessageCircle, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    ];
  } else {
    stats = [
      { label: 'My Orders', value: orderCount, icon: ShoppingBag, color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
      { label: 'Wishlist Items', value: favoriteListings.length, icon: Heart, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
      { label: 'Chat Inquiries', value: 0, icon: MessageCircle, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    ];
  }

  return (
    <PageTransition>
      <style>{styles}</style>
      <div className="db-page">
        <header className="db-header">
          <div>
            <h1 className="db-welcome">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <div className="db-date"><Calendar size={14} /> {today}</div>
          </div>
          {canSell && (
            <Link to="/create-listing">
              <Button icon={PlusCircle}>New Listing</Button>
            </Link>
          )}
        </header>

        <div className="db-stats">
          {stats.map(s => (
            <motion.div 
              key={s.label}
              className="stat-card"
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <s.icon size={22} />
              </div>
              <div>
                <div className="stat-val">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="db-section">
          <div className="db-sec-title">
            <span>Recent Platform Listings</span>
            <Link to="/browse" style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Browse all <ArrowUpRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 280 }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              {recentListings.map(item => (
                <ListingCard key={item._id} listing={item} />
              ))}
            </div>
          )}
        </div>

        <div className="db-section">
          <div className="db-sec-title">Quick Actions</div>
          <div className="quick-grid">
            {canSell && (
              <Link to="/create-listing" className="quick-card">
                <PlusCircle size={28} color="var(--accent)" />
                <div>
                  <div style={{ fontWeight: 700 }}>Post New Item</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Sell unused items fast</div>
                </div>
              </Link>
            )}
            <Link to="/browse" className="quick-card">
              <Search size={28} color="#10b981" />
              <div>
                <div style={{ fontWeight: 700 }}>Explore Marketplace</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Search products & filter</div>
              </div>
            </Link>
            <Link to="/orders" className="quick-card">
              <ShoppingBag size={28} color="#6366f1" />
              <div>
                <div style={{ fontWeight: 700 }}>My Orders & Purchases</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Track deliveries & status</div>
              </div>
            </Link>
            {isAdmin && (
              <Link to="/admin" className="quick-card">
                <Users size={28} color="#f59e0b" />
                <div>
                  <div style={{ fontWeight: 700 }}>Admin Dashboard</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Moderate users, listings & orders</div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
