import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Smartphone, Lock, ArrowLeft, Truck, CircleCheckBig } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input, { Select } from '../components/ui/Input';
import Modal from '../components/ui/Modal';

const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const PLATFORM_FEE_RATE = 0.05;

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
  'Chandigarh','Puducherry','Andaman & Nicobar','Dadra & Nagar Haveli','Lakshadweep'
];

const styles = `
  .checkout-page {
    min-height: 80vh;
    animation: fadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    padding-bottom: 80px;
  }
  .checkout-page .container {
    padding-top: 40px;
  }
  .checkout-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 28px;
    transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    text-decoration: none;
  }
  .checkout-back:hover {
    color: var(--accent);
    gap: 10px;
  }
  .checkout-header {
    margin-bottom: 36px;
  }
  .checkout-header h1 {
    font-size: 30px;
    font-weight: 700;
    letter-spacing: -0.3px;
  }
  .checkout-layout {
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: 36px;
    align-items: start;
  }
  .checkout-section {
    margin-bottom: 32px;
  }
  .checkout-section-title {
    font-size: 17px;
    font-weight: 600;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text);
  }
  .checkout-section-title .step-num {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .checkout-form-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-xl);
    padding: 28px;
    box-shadow: var(--shadow-card);
    transition: box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .checkout-form-card:hover {
    box-shadow: var(--shadow-card-hover);
  }
  .checkout-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  .checkout-payment-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .payment-option {
    border: 2px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 24px 18px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
    background: var(--bg-secondary);
    position: relative;
  }
  .payment-option:hover {
    border-color: var(--text-tertiary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-card-hover);
  }
  .payment-option.selected {
    border-color: var(--accent);
    background: var(--accent-light);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
  }
  .payment-option.selected::after {
    content: '';
    position: absolute;
    top: 12px;
    right: 12px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .payment-option-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-lg);
    background: var(--bg-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .payment-option.selected .payment-option-icon {
    background: var(--accent);
    color: #fff;
    transform: scale(1.05);
  }
  .payment-option-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
  }
  .payment-option-desc {
    font-size: 12px;
    color: var(--text-tertiary);
  }
  .checkout-terms {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-top: 22px;
    padding: 18px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-xl);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .checkout-terms:hover {
    background: var(--bg-secondary);
  }
  .checkout-terms input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--accent);
    cursor: pointer;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .checkout-terms-text {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.55;
  }
  .checkout-terms-text a {
    color: var(--accent);
    font-weight: 500;
  }
  .checkout-terms.error {
    border: 1px solid var(--error);
    background: var(--error-bg);
  }
  .checkout-place-btn {
    margin-top: 24px;
  }
  .checkout-place-btn .btn {
    width: 100%;
  }

  /* Sidebar */
  .checkout-sidebar {
    position: sticky;
    top: calc(var(--nav-height) + 24px);
  }
  .checkout-order-summary {
    background: var(--bg-secondary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-card);
    overflow: hidden;
  }
  .checkout-order-header {
    padding: 22px 26px;
    border-bottom: 1px solid var(--border-light);
  }
  .checkout-order-header h3 {
    font-size: 17px;
    font-weight: 600;
  }
  .checkout-order-items {
    padding: 18px 26px;
    max-height: 360px;
    overflow-y: auto;
  }
  .checkout-order-item {
    display: flex;
    gap: 14px;
    padding: 12px 0;
  }
  .checkout-order-item + .checkout-order-item {
    border-top: 1px solid var(--border-light);
  }
  .checkout-order-item-img {
    width: 58px;
    height: 58px;
    border-radius: var(--radius-lg);
    overflow: hidden;
    flex-shrink: 0;
    background: var(--bg-tertiary);
  }
  .checkout-order-item-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .checkout-order-item-info {
    flex: 1;
    min-width: 0;
  }
  .checkout-order-item-name {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text);
  }
  .checkout-order-item-price {
    font-size: 14px;
    font-weight: 600;
    color: var(--accent);
    margin-top: 4px;
  }
  .checkout-order-summary-footer {
    padding: 22px 26px;
    border-top: 1px solid var(--border-light);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .checkout-order-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
  }
  .checkout-order-row .label {
    color: var(--text-secondary);
  }
  .checkout-order-row .value {
    font-weight: 500;
  }
  .checkout-order-divider {
    height: 1px;
    background: var(--border-light);
    margin: 4px 0;
  }
  .checkout-order-total {
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    font-weight: 700;
  }
  .checkout-order-total .value {
    color: var(--accent);
    font-size: 22px;
  }

  /* Success Modal */
  .success-modal-body {
    text-align: center;
    padding: 16px 0 8px;
  }
  .success-checkmark {
    width: 84px;
    height: 84px;
    border-radius: 50%;
    background: var(--success-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 22px;
    animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .success-checkmark svg {
    color: var(--success);
  }
  .success-modal-body h3 {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 10px;
  }
  .success-modal-body p {
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 6px;
  }
  .success-order-id {
    display: inline-block;
    margin-top: 14px;
    padding: 8px 16px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-lg);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    font-family: monospace;
  }

  @media (max-width: 860px) {
    .checkout-layout {
      grid-template-columns: 1fr;
    }
    .checkout-sidebar {
      position: static;
      order: -1;
    }
  }
  @media (max-width: 520px) {
    .checkout-form-row {
      grid-template-columns: 1fr;
    }
    .checkout-payment-options {
      grid-template-columns: 1fr;
    }
  }
`;

const initialForm = {
  name: '', email: '', phone: '',
  address: '', city: '', state: '', pincode: '',
};

function validate(form) {
  const e = {};
  if (!form.name.trim()) e.name = 'Name is required';
  if (!form.email.trim()) e.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
  if (!form.phone.trim()) e.phone = 'Phone number is required';
  else if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid 10-digit number';
  if (!form.address.trim()) e.address = 'Address is required';
  if (!form.city.trim()) e.city = 'City is required';
  if (!form.state) e.state = 'State is required';
  if (!form.pincode.trim()) e.pincode = 'Pin code is required';
  else if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Enter a valid 6-digit pin code';
  return e;
}

export default function Checkout() {
  const { items, total, count, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ...initialForm,
    name: user?.name || '',
    email: user?.email || '',
  });
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [agreed, setAgreed] = useState(false);
  const [agreedError, setAgreedError] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  const platformFee = Math.round(total * PLATFORM_FEE_RATE);
  const orderTotal = total + platformFee;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    if (!agreed) {
      setAgreedError(true);
      return;
    }
    setAgreedError(false);
    setPlacing(true);

    await new Promise((r) => setTimeout(r, 1500));

    const id = `NXS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setOrderId(id);
    setPlacing(false);
    setShowSuccess(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    clearCart();
    navigate('/');
  };

  if (count === 0 && !showSuccess) {
    return (
      <>
        <style>{styles}</style>
        <div className="checkout-page">
          <div className="container">
            <Link to="/cart" className="checkout-back"><ArrowLeft size={16} /> Back to Cart</Link>
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <h2 style={{ marginBottom: 8 }}>No items to checkout</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Your cart is empty.</p>
              <Link to="/browse">
                <Button variant="primary">Browse Listings</Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="checkout-page">
        <div className="container">
          <Link to="/cart" className="checkout-back"><ArrowLeft size={16} /> Back to Cart</Link>
          <div className="checkout-header">
            <h1>Checkout</h1>
          </div>

          <div className="checkout-layout">
            <form onSubmit={handlePlaceOrder}>
              <div className="checkout-section">
                <div className="checkout-section-title">
                  <span className="step-num">1</span>
                  Shipping Details
                </div>
                <div className="checkout-form-card">
                  <div className="checkout-form-row">
                    <Input
                      label="Full Name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      error={errors.name}
                      placeholder="John Doe"
                    />
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      error={errors.email}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="checkout-form-row" style={{ marginTop: 16 }}>
                    <Input
                      label="Phone Number"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      error={errors.phone}
                      placeholder="9876543210"
                      maxLength={10}
                    />
                    <Input
                      label="Pin Code"
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      error={errors.pincode}
                      placeholder="110001"
                      maxLength={6}
                    />
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <Input
                      label="Address"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      error={errors.address}
                      placeholder="Street address, apartment, etc."
                    />
                  </div>
                  <div className="checkout-form-row" style={{ marginTop: 16 }}>
                    <Input
                      label="City"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      error={errors.city}
                      placeholder="New Delhi"
                    />
                    <Select
                      label="State"
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      error={errors.state}
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>

              <div className="checkout-section">
                <div className="checkout-section-title">
                  <span className="step-num">2</span>
                  Payment Method
                </div>
                <div className="checkout-form-card">
                  <div className="checkout-payment-options">
                    <div
                      className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('cod')}
                    >
                      <div className="payment-option-icon">
                        <Truck size={22} />
                      </div>
                      <span className="payment-option-label">Cash on Delivery</span>
                      <span className="payment-option-desc">Pay when you receive</span>
                    </div>
                    <div
                      className={`payment-option ${paymentMethod === 'upi' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('upi')}
                    >
                      <div className="payment-option-icon">
                        <Smartphone size={22} />
                      </div>
                      <span className="payment-option-label">UPI Payment</span>
                      <span className="payment-option-desc">GPay, PhonePe, etc.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="checkout-section">
                <div
                  className={`checkout-terms ${agreedError ? 'error' : ''}`}
                  onClick={() => { setAgreed(!agreed); setAgreedError(false); }}
                >
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => { setAgreed(e.target.checked); setAgreedError(false); }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="checkout-terms-text">
                    I agree to the <a href="#terms" onClick={(e) => e.stopPropagation()}>Terms of Service</a> and <a href="#privacy" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>. I confirm that all shipping details are correct.
                  </span>
                </div>
              </div>

              <div className="checkout-place-btn">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={placing}
                  icon={Lock}
                >
                  {paymentMethod === 'cod' ? 'Place Order (Cash on Delivery)' : 'Pay & Place Order'}
                </Button>
              </div>
            </form>

            <div className="checkout-sidebar">
              <div className="checkout-order-summary">
                <div className="checkout-order-header">
                  <h3>Order Summary</h3>
                </div>
                <div className="checkout-order-items">
                  {items.map((item) => (
                    <div key={item._id} className="checkout-order-item">
                      <div className="checkout-order-item-img">
                        {item.image ? <img src={item.image} alt={item.title} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text-tertiary)' }}>N/A</div>}
                      </div>
                      <div className="checkout-order-item-info">
                        <div className="checkout-order-item-name">{item.title}</div>
                        <div className="checkout-order-item-price">{fmt.format(item.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="checkout-order-summary-footer">
                  <div className="checkout-order-row">
                    <span className="label">Subtotal</span>
                    <span className="value">{fmt.format(total)}</span>
                  </div>
                  <div className="checkout-order-row">
                    <span className="label">Platform fee (5%)</span>
                    <span className="value">{fmt.format(platformFee)}</span>
                  </div>
                  <div className="checkout-order-row">
                    <span className="label">Shipping</span>
                    <span className="value" style={{ color: 'var(--success)' }}>Free</span>
                  </div>
                  <div className="checkout-order-divider" />
                  <div className="checkout-order-total">
                    <span>Total</span>
                    <span className="value">{fmt.format(orderTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal open={showSuccess} onClose={handleSuccessClose} size="sm" title="">
        <div className="success-modal-body">
          <div className="success-checkmark">
            <CircleCheckBig size={40} strokeWidth={2} />
          </div>
          <h3>Order Placed Successfully!</h3>
          <p>
            Your order has been confirmed. You will receive a confirmation
            {paymentMethod === 'cod' ? ' shortly.' : ' with payment details shortly.'}
          </p>
          {orderId && <div className="success-order-id">{orderId}</div>}
          <div style={{ marginTop: 24 }}>
            <Button variant="primary" fullWidth onClick={handleSuccessClose}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
