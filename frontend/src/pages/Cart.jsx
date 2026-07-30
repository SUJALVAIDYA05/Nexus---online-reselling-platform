import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import PageTransition from '../components/ui/PageTransition';

const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const PLATFORM_FEE_RATE = 0.05;

const styles = `
  .cart-page { padding: 40px 0 80px; }
  .cart-header { margin-bottom: 36px; }
  .cart-title { font-size: 32px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
  .cart-count { color: var(--text-tertiary); font-size: 16px; font-weight: 500; margin-left: 10px; }

  .cart-layout { display: grid; grid-template-columns: 1fr 400px; gap: 36px; align-items: start; }
  .cart-items { display: flex; flex-direction: column; gap: 16px; }

  .cart-item {
    display: flex; gap: 20px; padding: 20px;
    background: var(--bg-glass); backdrop-filter: blur(16px);
    border: 1px solid var(--border); border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
  }
  .cart-item-image {
    width: 110px; height: 110px; border-radius: var(--radius-lg);
    overflow: hidden; flex-shrink: 0; background: #070a12;
  }
  .cart-item-image img { width: 100%; height: 100%; object-fit: cover; }
  .cart-item-details { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
  .cart-item-title { font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; margin-bottom: 6px; display: block; }
  .cart-item-title:hover { color: var(--accent); }
  .cart-item-price { font-size: 20px; font-weight: 800; color: var(--accent); }

  .cart-summary {
    background: var(--bg-glass); backdrop-filter: blur(20px);
    border: 1px solid var(--border); border-radius: var(--radius-2xl);
    padding: 32px; position: sticky; top: 100px;
  }
  .summary-title { font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 24px; }
  .summary-row { display: flex; justify-content: space-between; font-size: 15px; color: var(--text-secondary); margin-bottom: 14px; }
  .summary-divider { height: 1px; background: var(--border-light); margin: 20px 0; }
  .summary-total { display: flex; justify-content: space-between; font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 28px; }

  @media (max-width: 992px) {
    .cart-layout { grid-template-columns: 1fr; }
  }
`;

export default function Cart() {
  const { items, removeItem, clearCart, total: subtotal } = useCart();
  const navigate = useNavigate();

  const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE);
  const total = subtotal + platformFee;

  if (items.length === 0) {
    return (
      <PageTransition>
        <style>{styles}</style>
        <div className="cart-page">
          <div className="container">
            <EmptyState
              icon={ShoppingBag}
              title="Your cart is empty"
              description="Looks like you haven't added any pre-owned goods to your cart yet."
              action={
                <Button size="lg" icon={ArrowRight} onClick={() => navigate('/browse')}>
                  Start Browsing
                </Button>
              }
            />
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <style>{styles}</style>
      <div className="cart-page">
        <div className="container">
          <div className="cart-header">
            <h1 className="cart-title">
              Shopping Cart
              <span className="cart-count">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
            </h1>
          </div>

          <div className="cart-layout">
            <div className="cart-items">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item._id}
                    className="cart-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="cart-item-image">
                      {item.images?.[0]?.url ? (
                        <img src={item.images[0].url} alt={item.title} />
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>No Image</div>
                      )}
                    </div>
                    <div className="cart-item-details">
                      <div>
                        <Link to={`/listing/${item._id}`} className="cart-item-title">{item.title}</Link>
                        {item.seller?.name && (
                          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Seller: {item.seller.name}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="cart-item-price">{fmt.format(item.price)}</span>
                        <motion.button
                          onClick={() => removeItem(item._id)}
                          whileHover={{ scale: 1.1, color: 'var(--error)' }}
                          whileTap={{ scale: 0.9 }}
                          style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <div style={{ marginTop: 12 }}>
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  Clear All Cart Items
                </Button>
              </div>
            </div>

            <div className="cart-summary">
              <h2 className="summary-title">Order Summary</h2>

              <div className="summary-row">
                <span>Subtotal</span>
                <span>{fmt.format(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Platform Guarantee Fee (5%)</span>
                <span>{fmt.format(platformFee)}</span>
              </div>
              <div className="summary-row">
                <span>Buyer Protection</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>Free</span>
              </div>

              <div className="summary-divider" />

              <div className="summary-total">
                <span>Total Amount</span>
                <span style={{ color: 'var(--accent)' }}>{fmt.format(total)}</span>
              </div>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                iconRight={ArrowRight}
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </Button>

              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-tertiary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={16} color="var(--success)" /> Verified Escrow Protection
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Truck size={16} color="var(--info)" /> Direct Buyer-Seller Logistics
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
