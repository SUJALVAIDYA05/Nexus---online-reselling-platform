import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const PLATFORM_FEE_RATE = 0.05;

const styles = `
  .cart-page {
    min-height: 80vh;
    animation: fadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .cart-page .container {
    padding-top: 40px;
    padding-bottom: 80px;
  }
  .cart-header {
    margin-bottom: 40px;
  }
  .cart-header h1 {
    font-size: 30px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.3px;
  }
  .cart-header-count {
    color: var(--text-tertiary);
    font-size: 15px;
    font-weight: 400;
    margin-left: 8px;
  }
  .cart-layout {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 36px;
    align-items: start;
  }
  .cart-items {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .cart-item {
    display: flex;
    gap: 22px;
    padding: 22px;
    background: var(--bg-secondary);
    border-radius: var(--radius-xl);
    border: 1px solid var(--border-light);
    box-shadow: var(--shadow-card);
    transition: box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .cart-item:hover {
    border-color: var(--border);
    box-shadow: var(--shadow-card-hover);
    transform: translateY(-1px);
  }
  .cart-item-image {
    width: 124px;
    height: 124px;
    border-radius: var(--radius-lg);
    overflow: hidden;
    flex-shrink: 0;
    background: var(--bg-tertiary);
  }
  .cart-item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .cart-item:hover .cart-item-image img {
    transform: scale(1.04);
  }
  .cart-item-image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-tertiary);
    font-size: 13px;
  }
  .cart-item-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 4px;
  }
  .cart-item-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }
  .cart-item-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.2s ease;
  }
  .cart-item-title:hover {
    color: var(--accent);
  }
  .cart-item-remove {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-tertiary);
    transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    cursor: pointer;
    border: none;
    background: none;
  }
  .cart-item-remove:hover {
    background: var(--error-bg);
    color: var(--error);
    transform: scale(1.08);
  }
  .cart-item-meta {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 8px;
  }
  .cart-item-seller {
    font-size: 13px;
    color: var(--text-secondary);
  }
  .cart-item-seller strong {
    color: var(--text);
    font-weight: 500;
  }
  .cart-item-price {
    font-size: 20px;
    font-weight: 700;
    color: var(--accent);
  }
  .cart-sidebar {
    position: sticky;
    top: calc(var(--nav-height) + 24px);
  }
  .cart-summary {
    background: var(--bg-secondary);
    border-radius: var(--radius-xl);
    border: 1px solid var(--border-light);
    box-shadow: var(--shadow-card);
    overflow: hidden;
  }
  .cart-summary-header {
    padding: 22px 26px;
    border-bottom: 1px solid var(--border-light);
  }
  .cart-summary-header h3 {
    font-size: 17px;
    font-weight: 600;
  }
  .cart-summary-body {
    padding: 22px 26px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .cart-summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
  }
  .cart-summary-row .label {
    color: var(--text-secondary);
  }
  .cart-summary-row .value {
    font-weight: 500;
    color: var(--text);
  }
  .cart-summary-divider {
    height: 1px;
    background: var(--border-light);
    margin: 6px 0;
  }
  .cart-summary-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-weight: 700;
  }
  .cart-summary-total .value {
    color: var(--accent);
    font-size: 22px;
  }
  .cart-summary-footer {
    padding: 20px 26px 24px;
    border-top: 1px solid var(--border-light);
  }
  .cart-summary-footer .btn {
    width: 100%;
  }
  .cart-benefits {
    margin-top: 18px;
    padding: 22px 26px;
    background: var(--bg-secondary);
    border-radius: var(--radius-xl);
    border: 1px solid var(--border-light);
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .cart-benefit {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 13px;
    color: var(--text-secondary);
  }
  .cart-benefit-icon {
    width: 34px;
    height: 34px;
    border-radius: var(--radius-lg);
    background: var(--accent-light);
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .cart-continue {
    margin-top: 32px;
    text-align: center;
  }
  .cart-continue a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    color: var(--accent);
    transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .cart-continue a:hover {
    opacity: 0.8;
    gap: 10px;
  }
  .cart-empty-wrap {
    padding: 80px 24px;
  }
  @media (max-width: 860px) {
    .cart-layout {
      grid-template-columns: 1fr;
    }
    .cart-sidebar {
      position: static;
    }
    .cart-item {
      padding: 18px;
      gap: 16px;
    }
    .cart-item-image {
      width: 96px;
      height: 96px;
    }
  }
  @media (max-width: 520px) {
    .cart-item {
      flex-direction: column;
      gap: 14px;
    }
    .cart-item-image {
      width: 100%;
      height: 180px;
    }
    .cart-item-top {
      flex-direction: column;
      gap: 4px;
    }
    .cart-item-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }
`;

export default function Cart() {
  const { items, removeItem, total, count } = useCart();
  const navigate = useNavigate();

  const platformFee = Math.round(total * PLATFORM_FEE_RATE);
  const orderTotal = total + platformFee;

  if (count === 0) {
    return (
      <>
        <style>{styles}</style>
        <div className="cart-page">
          <div className="container">
            <div className="cart-empty-wrap">
              <EmptyState
                icon={ShoppingBag}
                title="Your cart is empty"
                description="Looks like you haven't added anything to your cart yet. Browse listings and find something you love."
                action={
                  <Link to="/browse">
                    <Button variant="primary" iconRight={ArrowRight}>
                      Browse Listings
                    </Button>
                  </Link>
                }
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="cart-page">
        <div className="container">
          <div className="cart-header">
            <h1>Shopping Cart <span className="cart-header-count">{count} {count === 1 ? 'item' : 'items'}</span></h1>
          </div>
          <div className="cart-layout">
            <div className="cart-items">
              {items.map((item) => (
                <div key={item._id} className="cart-item">
                  <Link to={`/listing/${item._id}`} className="cart-item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.title} />
                    ) : (
                      <div className="cart-item-image-placeholder">No Image</div>
                    )}
                  </Link>
                  <div className="cart-item-details">
                    <div className="cart-item-top">
                      <Link to={`/listing/${item._id}`} className="cart-item-title">{item.title}</Link>
                      <button
                        className="cart-item-remove"
                        onClick={() => removeItem(item._id)}
                        title="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="cart-item-meta">
                      <span className="cart-item-seller">
                        Seller: <strong>{item.seller?.name || 'Unknown'}</strong>
                      </span>
                      <span className="cart-item-price">{fmt.format(item.price)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-sidebar">
              <div className="cart-summary">
                <div className="cart-summary-header">
                  <h3>Order Summary</h3>
                </div>
                <div className="cart-summary-body">
                  <div className="cart-summary-row">
                    <span className="label">Subtotal ({count} {count === 1 ? 'item' : 'items'})</span>
                    <span className="value">{fmt.format(total)}</span>
                  </div>
                  <div className="cart-summary-row">
                    <span className="label">Platform fee (5%)</span>
                    <span className="value">{fmt.format(platformFee)}</span>
                  </div>
                  <div className="cart-summary-row">
                    <span className="label">Shipping</span>
                    <span className="value" style={{ color: 'var(--success)' }}>Free</span>
                  </div>
                  <div className="cart-summary-divider" />
                  <div className="cart-summary-total">
                    <span>Total</span>
                    <span className="value">{fmt.format(orderTotal)}</span>
                  </div>
                </div>
                <div className="cart-summary-footer">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    iconRight={ArrowRight}
                    onClick={() => navigate('/checkout')}
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </div>

              <div className="cart-benefits">
                <div className="cart-benefit">
                  <div className="cart-benefit-icon"><ShieldCheck size={16} /></div>
                  <span>Secure payment & buyer protection</span>
                </div>
                <div className="cart-benefit">
                  <div className="cart-benefit-icon"><Truck size={16} /></div>
                  <span>Free shipping on all orders</span>
                </div>
                <div className="cart-benefit">
                  <div className="cart-benefit-icon"><RotateCcw size={16} /></div>
                  <span>Easy returns within 3 days</span>
                </div>
              </div>
            </div>
          </div>

          <div className="cart-continue">
            <Link to="/browse">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Continue Shopping
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
