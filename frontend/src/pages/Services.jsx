import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, Search, CreditCard, Truck, Shield, Zap, Headphones } from 'lucide-react';
import Button from '../components/ui/Button';
import PageTransition from '../components/ui/PageTransition';

const services = [
  { icon: Camera, title: 'Easy Item Listing', description: 'Snap photos, set pricing, and publish in under 60 seconds.', color: '#f43f5e' },
  { icon: Search, title: 'Smart Search & Filter', description: 'Find pre-owned items with category, location, and price filters.', color: '#3b82f6' },
  { icon: CreditCard, title: 'Escrow Payment Guard', description: 'Funds held securely until buyer receives and approves delivery.', color: '#10b981' },
  { icon: Truck, title: 'Pan-India Delivery', description: 'Tracked shipping partnerships across 50+ major cities.', color: '#f59e0b' },
];

const styles = `
  .srv-hero { padding: 90px 24px; text-align: center; background: radial-gradient(circle at 50% 30%, #1e293b 0%, #0f172a 100%); }
  .srv-title { font-size: clamp(34px, 5.5vw, 54px); font-weight: 900; color: #ffffff; letter-spacing: -1.5px; margin-bottom: 20px; }
  .srv-accent { background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  
  .srv-sec { padding: 80px 24px; }
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 28px; }
  .srv-card { background: var(--bg-glass); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: var(--radius-2xl); padding: 36px; }

  @media (max-width: 768px) {
    .grid-2 { grid-template-columns: 1fr; }
  }
`;

export default function Services() {
  return (
    <PageTransition>
      <style>{styles}</style>
      <div>
        <section className="srv-hero">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="srv-title">
              Complete Reselling Services<br />
              <span className="srv-accent">Built for Safety & Convenience</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 600, margin: '0 auto 32px' }}>
              From drag-and-drop listings to escrow protection and shipping, NEXUS handles every step.
            </p>
            <Link to="/browse">
              <Button size="lg" iconRight={ArrowRight}>Start Browsing</Button>
            </Link>
          </motion.div>
        </section>

        <section className="srv-sec">
          <div className="container">
            <div className="grid-2">
              {services.map((s, i) => (
                <motion.div key={i} className="srv-card" whileHover={{ y: -6 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <s.icon size={28} color={s.color} />
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', marginBottom: 12 }}>{s.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 15 }}>{s.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
