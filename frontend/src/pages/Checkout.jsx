import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';
import {
  QrCode, Lock, ArrowLeft, Truck, CheckCircle2, ShieldCheck, Clock, RefreshCw, AlertCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orders } from '../api/api';
import Button from '../components/ui/Button';
import Input, { Select } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import PageTransition from '../components/ui/PageTransition';

const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const PLATFORM_FEE_RATE = 0.05;

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
  'Chandigarh','Puducherry'
];

const styles = `
  .co-page { padding: 40px 0 80px; }
  .co-back { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-secondary); text-decoration: none; margin-bottom: 24px; }
  .co-back:hover { color: #ffffff; }

  .co-layout { display: grid; grid-template-columns: 1fr 420px; gap: 36px; align-items: start; }
  .co-card { background: var(--bg-glass); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: var(--radius-2xl); padding: 32px; margin-bottom: 28px; }
  .co-card-title { font-size: 18px; font-weight: 800; color: #ffffff; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
  .co-step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }

  .co-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }

  .payment-options { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .payment-opt {
    border: 2px solid var(--border); border-radius: var(--radius-xl); padding: 20px; cursor: pointer;
    background: rgba(255,255,255,0.02); display: flex; flex-direction: column; align-items: center; gap: 10px;
    text-align: center; color: var(--text-secondary); transition: all 0.2s;
  }
  .payment-opt:hover { border-color: rgba(255,255,255,0.2); color: #ffffff; }
  .payment-opt.selected { border-color: var(--accent); background: rgba(244,63,94,0.12); color: #ffffff; }

  .qr-container {
    display: flex; flex-direction: column; align-items: center; text-align: center;
    background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border);
    border-radius: var(--radius-xl); padding: 28px; margin-top: 16px;
  }
  .qr-box {
    background: #ffffff; padding: 16px; border-radius: 16px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4); margin: 16px 0; display: inline-block;
  }
  .qr-box img { width: 220px; height: 220px; display: block; object-fit: contain; }

  .timer-pill {
    display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px;
    background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3);
    border-radius: var(--radius-full); color: #f43f5e; font-weight: 700; font-size: 14px;
  }

  .pulse-loader {
    display: inline-block; width: 10px; height: 10px; border-radius: 50%;
    background-color: var(--accent); animation: pulse 1.5s infinite;
  }
  @keyframes pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
  }

  .summary-card { background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: var(--radius-2xl); padding: 32px; position: sticky; top: 100px; }
  .summary-item { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
  .summary-item-img { width: 48px; height: 48px; border-radius: var(--radius-md); overflow: hidden; background: #000; flex-shrink: 0; }
  .summary-item-img img { width: 100%; height: 100%; object-fit: cover; }

  @media (max-width: 992px) {
    .co-layout { grid-template-columns: 1fr; }
    .co-grid { grid-template-columns: 1fr; }
  }
`;

export default function Checkout() {
  const { items, clearCart, total: subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('upi_qr');
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  // UPI QR Payment flow states: 'idle' | 'waiting' | 'paid' | 'expired' | 'failed'
  const [paymentState, setPaymentState] = useState('idle');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [timeLeftSec, setTimeLeftSec] = useState(600);

  const pollIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const [simulating, setSimulating] = useState(false);

  const handleSimulatePayment = async () => {
    if (!createdOrder?._id) return;
    setSimulating(true);
    try {
      await orders.simulatePayment(createdOrder._id);
      toast.success('Simulated payment received!');
    } catch (err) {
      toast.error(err?.message || 'Failed to simulate payment');
    } finally {
      setSimulating(false);
    }
  };

  const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE);

  const total = subtotal + platformFee;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(formData.phone.trim())) errs.phone = 'Enter valid 10-digit number';
    if (!formData.address.trim()) errs.address = 'Street address is required';
    if (!formData.city.trim()) errs.city = 'City is required';
    if (!formData.pincode.trim()) errs.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(formData.pincode.trim())) errs.pincode = 'Enter valid 6-digit pincode';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Helper to clear polling and timer intervals
  const stopTimers = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  useEffect(() => {
    return () => stopTimers();
  }, []);

  // Handle countdown & polling during 'waiting' state
  useEffect(() => {
    if (paymentState !== 'waiting' || !createdOrder?._id) return;

    // 1. Polling interval every 3 seconds
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await orders.getPaymentStatus(createdOrder._id);
        if (res.paymentStatus === 'paid') {
          stopTimers();
          setPaymentState('paid');
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
          clearCart();
          setSuccessModal(true);
        } else if (res.paymentStatus === 'expired' || res.paymentStatus === 'failed') {
          stopTimers();
          setPaymentState(res.paymentStatus);
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    }, 3000);

    // 2. Countdown timer interval every 1 second
    const expiresAtMs = createdOrder.razorpay?.expiresAt
      ? new Date(createdOrder.razorpay.expiresAt).getTime()
      : Date.now() + 600000;

    timerIntervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      setTimeLeftSec(remaining);
      if (remaining <= 0) {
        stopTimers();
        setPaymentState('expired');
      }
    }, 1000);

    return () => stopTimers();
  }, [paymentState, createdOrder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        items: items.map((i) => i._id),
        shippingAddress: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          pincode: formData.pincode.trim(),
          addressLine: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state,
        },
        paymentMethod,
      };

      const newOrder = await orders.create(payload);

      if (paymentMethod === 'cod') {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        clearCart();
        setCreatedOrder(newOrder);
        setSuccessModal(true);
      } else {
        // paymentMethod === 'upi_qr'
        setCreatedOrder(newOrder);
        setPaymentState('waiting');
        toast.success('QR Code generated. Scan to complete your payment.');
      }
    } catch (err) {
      toast.error(err?.message || 'Could not place your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    stopTimers();
    setPaymentState('idle');
    setCreatedOrder(null);
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (items.length === 0 && !successModal && paymentState === 'idle') {
    return (
      <PageTransition>
        <style>{styles}</style>
        <div className="co-page">
          <div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
            <h2>Your cart is empty</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Add some items to checkout</p>
            <Button onClick={() => navigate('/browse')}>Browse Marketplace</Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <style>{styles}</style>
      <div className="co-page">
        <div className="container">
          <Link to="/cart" className="co-back">
            <ArrowLeft size={16} /> Return to Cart
          </Link>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#ffffff' }}>Checkout</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Complete your shipping details and safe payment</p>
          </div>

          <form onSubmit={handleSubmit} className="co-layout">
            <div className="co-main">
              <div className="co-card">
                <div className="co-card-title">
                  <span className="co-step-num">1</span> Delivery & Shipping Address
                </div>

                <div className="co-grid">
                  <Input
                    label="Full Name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    error={errors.fullName}
                    disabled={paymentState === 'waiting'}
                    placeholder="Enter recipient name"
                  />
                  <Input
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    disabled={paymentState === 'waiting'}
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Input
                    label="Street Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    error={errors.address}
                    disabled={paymentState === 'waiting'}
                    placeholder="House/Flat No, Building, Street"
                  />
                </div>

                <div className="co-grid">
                  <Input
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    error={errors.city}
                    disabled={paymentState === 'waiting'}
                    placeholder="City"
                  />
                  <Select
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    disabled={paymentState === 'waiting'}
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </div>

                <Input
                  label="Pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  error={errors.pincode}
                  disabled={paymentState === 'waiting'}
                  placeholder="6-digit Pincode"
                />
              </div>

              <div className="co-card">
                <div className="co-card-title">
                  <span className="co-step-num">2</span> Payment Method
                </div>

                {paymentState === 'idle' && (
                  <div className="payment-options">
                    <div
                      className={`payment-opt ${paymentMethod === 'upi_qr' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('upi_qr')}
                    >
                      <QrCode size={24} />
                      <span style={{ fontWeight: 700 }}>UPI — Scan to Pay</span>
                    </div>
                    <div
                      className={`payment-opt ${paymentMethod === 'cod' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('cod')}
                    >
                      <Truck size={24} />
                      <span style={{ fontWeight: 700 }}>Cash on Delivery</span>
                    </div>
                  </div>
                )}

                {paymentState === 'waiting' && createdOrder?.razorpay?.qrImageUrl && (
                  <div className="qr-container">
                    <div className="timer-pill">
                      <Clock size={16} /> Pay within {formatTimer(timeLeftSec)}
                    </div>

                    <div className="qr-box">
                      <img src={createdOrder.razorpay.qrImageUrl} alt="Scan to pay via UPI" />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ffffff', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                      <span className="pulse-loader" /> Waiting for payment...
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 320 }}>
                      Open GPay, PhonePe, Paytm, or any UPI app and scan the QR code above to pay {fmt.format(total)}.
                    </p>

                    {user?.role === 'admin' && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          loading={simulating}
                          onClick={handleSimulatePayment}
                        >
                          ⚡ Simulate Payment (Admin Only)
                        </Button>
                      </div>
                    )}
                  </div>


                )}

                {(paymentState === 'expired' || paymentState === 'failed') && (
                  <div className="qr-container" style={{ borderColor: '#f43f5e', background: 'rgba(244, 63, 94, 0.05)' }}>
                    <AlertCircle size={40} color="#f43f5e" style={{ marginBottom: 12 }} />
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', marginBottom: 8 }}>
                      {paymentState === 'expired' ? 'Payment Window Expired' : 'Payment Failed'}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, maxWidth: 360 }}>
                      {paymentState === 'expired'
                        ? 'The 10-minute QR code expiry window elapsed before payment was received. Your item reservation has been released.'
                        : 'We could not generate or confirm your payment. Please try again.'}
                    </p>
                    <Button variant="outline" icon={RefreshCw} onClick={handleTryAgain}>
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="summary-card">
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginBottom: 20 }}>Items in Order</h2>

              <div style={{ maxHeight: 240, overflowY: 'auto', marginBottom: 20 }}>
                {items.map((item) => (
                  <div key={item._id} className="summary-item">
                    <div className="summary-item-img">
                      {item.images?.[0]?.url && <img src={item.images[0].url} alt={item.title} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#ffffff', fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </div>
                      <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 14 }}>
                        {fmt.format(item.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: 8, fontSize: 14 }}>
                <span>Subtotal</span>
                <span>{fmt.format(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: 8, fontSize: 14 }}>
                <span>Platform Guarantee Fee</span>
                <span>{fmt.format(platformFee)}</span>
              </div>

              <div style={{ height: 1, background: 'var(--border-light)', margin: '16px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffffff', fontSize: 18, fontWeight: 800, marginBottom: 24 }}>
                <span>Total Due</span>
                <span style={{ color: 'var(--accent)' }}>{fmt.format(total)}</span>
              </div>

              {paymentState === 'idle' && (
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  loading={loading}
                  icon={Lock}
                >
                  {paymentMethod === 'upi_qr' ? 'Generate QR Code & Pay' : `Confirm Order (${fmt.format(total)})`}
                </Button>
              )}

              {paymentState === 'waiting' && (
                <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-secondary)', fontSize: 14, fontStyle: 'italic' }}>
                  Scan QR code on the left to complete purchase
                </div>
              )}

              {(paymentState === 'expired' || paymentState === 'failed') && (
                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  size="lg"
                  icon={RefreshCw}
                  onClick={handleTryAgain}
                >
                  Re-submit Order
                </Button>
              )}

              <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <ShieldCheck size={14} color="var(--success)" /> Encrypted 256-bit Secure Transaction
              </div>
            </div>
          </form>

          <Modal
            open={successModal}
            onClose={() => { setSuccessModal(false); navigate('/orders'); }}
            title="Order Placed Successfully!"
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle2 size={64} color="var(--success)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', marginBottom: 8 }}>Thank You for Your Order!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                Your order has been confirmed and the seller has been notified for dispatch.
              </p>
              <Button size="lg" onClick={() => { setSuccessModal(false); navigate('/orders'); }}>
                View Order Status
              </Button>
            </div>
          </Modal>
        </div>
      </div>
    </PageTransition>
  );
}
