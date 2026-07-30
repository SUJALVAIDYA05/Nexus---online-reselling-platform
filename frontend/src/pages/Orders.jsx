import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Package, TrendingUp, Clock,
  CheckCircle2, XCircle, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { users, favorites } from '../api/api';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import PageTransition from '../components/ui/PageTransition';

const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const tabs = [
  { key: 'all', label: 'All Orders', icon: ShoppingCart },
  { key: 'purchases', label: 'Purchases', icon: Package },
  { key: 'sales', label: 'My Sales', icon: TrendingUp },
];

const styles = `
  .ord-page { padding: 40px 0 80px; }
  .ord-tabs { display: flex; gap: 12px; margin-bottom: 32px; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
  .ord-tab { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: var(--radius-full); background: transparent; color: var(--text-secondary); border: 1px solid transparent; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s; }
  .ord-tab:hover { color: #ffffff; background: rgba(255,255,255,0.05); }
  .ord-tab.active { background: rgba(244,63,94,0.15); border-color: rgba(244,63,94,0.3); color: #ffffff; }

  .ord-list { display: flex; flex-direction: column; gap: 16px; }
  .ord-card { background: var(--bg-glass); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
  .ord-img { width: 72px; height: 72px; border-radius: var(--radius-lg); overflow: hidden; background: #070a12; flex-shrink: 0; }
  .ord-img img { width: 100%; height: 100%; object-fit: cover; }
`;

export default function Orders() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const [salesRes, favRes] = await Promise.allSettled([
          users.getListings(user.id || user._id),
          favorites.list(),
        ]);
        const salesData = salesRes.status === 'fulfilled' ? salesRes.value : [];
        setSales(Array.isArray(salesData) ? salesData : (salesData.listings || []));

        const favData = favRes.status === 'fulfilled' ? favRes.value : [];
        const favArr = Array.isArray(favData) ? favData : (favData.favorites || []);
        const purchasesArr = favArr
          .filter(f => f.listing)
          .map((f) => ({
            ...f.listing,
            _orderType: 'purchase',
            _orderStatus: f.listing.status === 'sold' ? 'completed' : 'pending',
            _orderDate: f.createdAt || new Date().toISOString(),
          }));
        setPurchases(purchasesArr);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchOrders();
  }, [user]);

  const allOrders = [
    ...sales.map(l => ({
      ...l,
      _orderType: 'sale',
      _orderStatus: l.status === 'sold' ? 'completed' : 'active',
      _orderDate: l.createdAt,
    })),
    ...purchases,
  ].sort((a, b) => new Date(b._orderDate) - new Date(a._orderDate));

  const filtered = activeTab === 'all' ? allOrders
    : activeTab === 'sales' ? allOrders.filter(o => o._orderType === 'sale')
    : allOrders.filter(o => o._orderType === 'purchase');

  return (
    <PageTransition>
      <style>{styles}</style>
      <div className="ord-page">
        <header style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#ffffff' }}>Orders & Activity</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track your marketplace purchases and sales history</p>
        </header>

        <div className="ord-tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`ord-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Spinner size={36} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders found"
            description="Start buying or selling on Nexus to see your activity here."
            action={
              <Link to="/browse">
                <Button icon={Eye}>Explore Marketplace</Button>
              </Link>
            }
          />
        ) : (
          <div className="ord-list">
            {filtered.map(order => (
              <motion.div 
                key={order._id}
                className="ord-card"
                whileHover={{ y: -2 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="ord-img">
                    {order.images?.[0]?.url && <img src={order.images[0].url} alt={order.title} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>{order.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                      Type: <strong style={{ color: order._orderType === 'sale' ? '#10b981' : 'var(--accent)' }}>{order._orderType.toUpperCase()}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', marginBottom: 4 }}>{fmt.format(order.price)}</div>
                  <Link to={`/listing/${order._id}`}>
                    <Button variant="ghost" size="sm" icon={Eye}>View Listing</Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
