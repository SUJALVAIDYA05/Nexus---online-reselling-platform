import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Quote } from 'lucide-react';
import Button from '../components/ui/Button';
import PageTransition from '../components/ui/PageTransition';

const testimonials = [
  {
    name: 'Rahul Verma',
    role: 'Frequent Buyer',
    initials: 'RV',
    stars: 5,
    quote: 'NEXUS has completely changed how I buy second-hand items. The verification system gives me confidence, and I have found amazing deals on electronics that work perfectly.',
    gradient: 'linear-gradient(135deg, #f43f5e, #c0392b)',
  },
  {
    name: 'Sneha Kapoor',
    role: 'Power Seller',
    initials: 'SK',
    stars: 5,
    quote: 'NEXUS has been my go-to platform for selling. The intuitive interface, reliable payments, and helpful support team make it a joy to use.',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  },
  {
    name: 'Vikram Joshi',
    role: 'First-time Seller',
    initials: 'VJ',
    stars: 5,
    quote: 'As someone who was nervous about selling online, NEXUS made the process incredibly smooth. Listed my old phone and sold it within two days!',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
  {
    name: 'Meera Nair',
    role: 'College Student',
    initials: 'MN',
    stars: 5,
    quote: 'Being a student on a budget, NEXUS has been a lifesaver. I have furnished my entire room with quality items at a fraction of retail price.',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
];

const styles = `
  .tst-hero { padding: 90px 24px; text-align: center; background: radial-gradient(circle at 50% 30%, #1e293b 0%, #0f172a 100%); }
  .tst-title { font-size: clamp(34px, 5.5vw, 54px); font-weight: 900; color: #ffffff; letter-spacing: -1.5px; margin-bottom: 20px; }
  .tst-accent { background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

  .tst-sec { padding: 80px 24px; }
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 28px; }
  .tst-card { background: var(--bg-glass); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: var(--radius-2xl); padding: 36px; display: flex; flex-direction: column; justify-content: space-between; }

  @media (max-width: 768px) {
    .grid-2 { grid-template-columns: 1fr; }
  }
`;

export default function Testimonials() {
  return (
    <PageTransition>
      <style>{styles}</style>
      <div>
        <section className="tst-hero">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="tst-title">
              What Our Community<br />
              <span className="tst-accent">Says About Nexus</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 540, margin: '0 auto 32px' }}>
              Real reviews from real buyers and sellers using Nexus every day.
            </p>
          </motion.div>
        </section>

        <section className="tst-sec">
          <div className="container">
            <div className="grid-2">
              {testimonials.map((t, i) => (
                <motion.div key={i} className="tst-card" whileHover={{ y: -6 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                      {Array.from({ length: t.stars }).map((_, s) => (
                        <Star key={s} size={18} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, marginBottom: 24, fontStyle: 'italic' }}>
                      "{t.quote}"
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: t.gradient, color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {t.initials}
                    </div>
                    <div>
                      <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 15 }}>{t.name}</div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
