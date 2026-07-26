import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Heart, MessageCircle, TrendingUp,
  PlusCircle, Search, ShoppingBag, ArrowUpRight, Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listings, favorites, users } from '../api/api';
import { Card, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ListingCard from '../components/listing/ListingCard';
import { SkeletonLine } from '../components/ui/Spinner';

export default function Dashboard() {
  const { user } = useAuth();
  const [myListings, setMyListings] = useState([]);
  const [favItems, setFavItems] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [myRes, favRes, recentRes] = await Promise.allSettled([
          users.getListings(user._id),
          favorites.list(),
          listings.list({ limit: 4, sort: '-createdAt' }),
        ]);
        const myData = myRes.status === 'fulfilled' ? myRes.value : [];
        const myListingsArr = Array.isArray(myData) ? myData : (myData.listings || []);
        setMyListings(myListingsArr);
        setFavItems(
          favRes.status === 'fulfilled'
            ? (Array.isArray(favRes.value) ? favRes.value : (favRes.value.favorites || []))
            : []
        );
        setRecentListings(
          recentRes.status === 'fulfilled'
            ? (recentRes.value.listings || [])
            : []
        );
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const activeListings = myListings.filter(l => l.status === 'active');
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const stats = [
    { label: 'My Listings', value: myListings.length, icon: Package, color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
    { label: 'Active Listings', value: activeListings.length, icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Wishlist', value: favItems.length, icon: Heart, color: '#e94560', bg: 'rgba(233,69,96,0.08)' },
    { label: 'Messages', value: 0, icon: MessageCircle, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-welcome">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="dashboard-date"><Calendar size={14} /> {today}</p>
        </div>
        <Link to="/create-listing">
          <Button icon={PlusCircle}>New Listing</Button>
        </Link>
      </header>

      <section className="dashboard-stats">
        {stats.map(s => (
          <Card key={s.label} hover className="stat-card">
            <CardBody>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <s.icon size={22} />
              </div>
              <div className="stat-info">
                {loading ? (
                  <SkeletonLine width={40} height={28} />
                ) : (
                  <span className="stat-value">{s.value}</span>
                )}
                <span className="stat-label">{s.label}</span>
              </div>
            </CardBody>
          </Card>
        ))}
      </section>

      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Your Recent Listings</h2>
          {myListings.length > 0 && (
            <Link to="/my-listings" className="section-link">View all <ArrowUpRight size={14} /></Link>
          )}
        </div>
        {loading ? (
          <div className="listings-grid">
            {[1,2,3,4].map(i => (
              <div key={i} className="card" style={{ overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: 180 }} />
                <div style={{ padding: 16 }}>
                  <SkeletonLine width="80%" height={16} />
                  <SkeletonLine width="50%" height={14} />
                  <SkeletonLine width="35%" height={22} />
                </div>
              </div>
            ))}
          </div>
        ) : recentListings.length === 0 ? (
          <div className="dashboard-empty">
            <Package size={40} strokeWidth={1.5} />
            <h3>No listings yet</h3>
            <p>Create your first listing and start selling!</p>
            <Link to="/create-listing">
              <Button icon={PlusCircle}>Create Listing</Button>
            </Link>
          </div>
        ) : (
          <div className="listings-grid">
            {recentListings.map(listing => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions">
          <Link to="/create-listing" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
              <PlusCircle size={24} />
            </div>
            <div>
              <h4>Create Listing</h4>
              <p>List a new item for sale</p>
            </div>
          </Link>
          <Link to="/browse" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
              <Search size={24} />
            </div>
            <div>
              <h4>Browse Items</h4>
              <p>Discover great deals</p>
            </div>
          </Link>
          <Link to="/messages" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
              <MessageCircle size={24} />
            </div>
            <div>
              <h4>Messages</h4>
              <p>Check your inbox</p>
            </div>
          </Link>
          <Link to="/favorites" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: 'rgba(233,69,96,0.1)', color: '#e94560' }}>
              <ShoppingBag size={24} />
            </div>
            <div>
              <h4>Wishlist</h4>
              <p>View saved items</p>
            </div>
          </Link>
        </div>
      </section>

      <style>{`
        .dashboard-page { max-width: 100%; }
        .dashboard-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 36px; gap: 16px; flex-wrap: wrap;
        }
        .dashboard-welcome {
          font-size: 28px; font-weight: 800; color: var(--text);
          margin: 0 0 6px; letter-spacing: -0.6px; line-height: 1.25;
        }
        .dashboard-date {
          font-size: 13px; color: var(--text-tertiary);
          display: flex; align-items: center; gap: 6px; margin: 0;
        }
        .dashboard-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 18px; margin-bottom: 44px;
        }
        .stat-card .card-body {
          padding: 22px 24px; display: flex; align-items: center; gap: 18px;
          transition: all var(--transition-slow);
        }
        .stat-icon {
          width: 52px; height: 52px; border-radius: var(--radius-xl);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          transition: transform var(--transition-slow);
        }
        .stat-card:hover .stat-icon { transform: scale(1.08); }
        .stat-info { display: flex; flex-direction: column; gap: 2px; }
        .stat-value { font-size: 26px; font-weight: 800; color: var(--text); line-height: 1.2; letter-spacing: -0.3px; }
        .stat-label { font-size: 13px; color: var(--text-tertiary); font-weight: 500; }
        .dashboard-section { margin-bottom: 44px; }
        .section-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 22px;
        }
        .section-title { font-size: 18px; font-weight: 700; color: var(--text); margin: 0; letter-spacing: -0.3px; }
        .section-link {
          font-size: 13px; font-weight: 600; color: var(--accent);
          text-decoration: none; display: flex; align-items: center; gap: 4px;
          transition: all var(--transition-fast); padding: 4px 8px;
          border-radius: var(--radius-sm); margin: -4px -8px;
        }
        .section-link:hover { background: var(--accent-light); }
        .listings-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(232px, 1fr));
          gap: 18px;
        }
        .dashboard-empty {
          text-align: center; padding: 56px 32px;
          background: var(--bg-secondary); border: 1px solid var(--border-light);
          border-radius: var(--radius-2xl); color: var(--text-tertiary);
          box-shadow: var(--shadow-card);
        }
        .dashboard-empty h3 { font-size: 17px; font-weight: 700; color: var(--text); margin: 14px 0 6px; }
        .dashboard-empty p { font-size: 14px; margin-bottom: 22px; line-height: 1.6; }
        .quick-actions { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
        .quick-action-card {
          display: flex; align-items: center; gap: 16px;
          padding: 20px 22px; background: var(--bg-secondary);
          border: 1px solid var(--border-light); border-radius: var(--radius-xl);
          text-decoration: none; transition: all var(--transition-slow); cursor: pointer;
          box-shadow: var(--shadow-card);
        }
        .quick-action-card:hover {
          border-color: var(--border); box-shadow: var(--shadow-card-hover);
          transform: translateY(-3px);
        }
        .quick-action-icon {
          width: 48px; height: 48px; border-radius: var(--radius-xl);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          transition: transform var(--transition-slow);
        }
        .quick-action-card:hover .quick-action-icon { transform: scale(1.08); }
        .quick-action-card h4 { font-size: 14px; font-weight: 700; color: var(--text); margin: 0 0 3px; }
        .quick-action-card p { font-size: 12px; color: var(--text-tertiary); margin: 0; }
        @media (max-width: 900px) { .dashboard-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) {
          .dashboard-stats { grid-template-columns: 1fr; }
          .dashboard-welcome { font-size: 24px; }
          .listings-grid { grid-template-columns: repeat(2, 1fr); }
          .quick-actions { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
