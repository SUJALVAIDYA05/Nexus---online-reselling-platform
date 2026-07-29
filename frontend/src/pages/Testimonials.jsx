import { Link } from 'react-router-dom';
import { ArrowRight, Star, Quote } from 'lucide-react';
import Button from '../components/ui/Button';

const testimonials = [
  {
    name: 'Rahul Verma',
    role: 'Frequent Buyer',
    initials: 'RV',
    stars: 5,
    quote: 'NEXUS has completely changed how I buy second-hand items. The verification system gives me confidence, and I have found amazing deals on electronics that work perfectly.',
    gradient: 'linear-gradient(135deg, #e94560, #c0392b)',
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
    stars: 4,
    quote: 'Being a student on a budget, NEXUS has been a lifesaver. I have furnished my entire dorm room with quality items at a fraction of retail price.',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
  {
    name: 'Arvind Reddy',
    role: 'Small Business Owner',
    initials: 'AR',
    stars: 5,
    quote: 'We use NEXUS to sell refurbished equipment. The platform handles everything from listings to payments seamlessly. It has become an essential sales channel for us.',
    gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  },
  {
    name: 'Divya Agarwal',
    role: 'Eco-conscious Buyer',
    initials: 'DA',
    stars: 5,
    quote: 'I love that NEXUS promotes reuse and sustainability. Buying pre-loved items feels good, and the quality guarantees mean I never worry about getting a bad deal.',
    gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
  },
];

function StarRating({ count }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={16}
          fill={i < count ? 'var(--warning)' : 'none'}
          color={i < count ? 'var(--warning)' : 'var(--border)'}
        />
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <div className="page-enter">
      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroBadge}>
            <Quote size={14} />
            <span>Testimonials</span>
          </div>
          <h1 style={styles.heroTitle}>
            What our users<br />
            <span style={styles.heroAccent}>say about us</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Don't take our word for it. Here's what our community has to say
            about their NEXUS experience.
          </p>
        </div>
      </section>

      {/* Testimonial Grid */}
      <section style={styles.section}>
        <div className="container" style={styles.container}>
          <div style={styles.testimonialsGrid}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ ...styles.testimonialCard, animation: `slideUp 0.4s ease ${0.08 * i}s both` }}>
                <div style={styles.quoteIcon}>
                  <Quote size={20} color="var(--accent)" />
                </div>
                <StarRating count={t.stars} />
                <p style={styles.quote}>"{t.quote}"</p>
                <div style={styles.author}>
                  <div style={{ ...styles.avatar, background: t.gradient }}>
                    <span style={styles.initials}>{t.initials}</span>
                  </div>
                  <div>
                    <p style={styles.name}>{t.name}</p>
                    <p style={styles.role}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={styles.ctaTitle}>Join our growing community</h2>
          <p style={styles.ctaSubtitle}>
            Experience the NEXUS difference. Start buying and selling today.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button as={Link} to="/signup" variant="primary" size="lg" iconRight={ArrowRight}>
              Get Started Free
            </Button>
            <Button as={Link} to="/browse" variant="ghost" size="lg" style={{ color: '#fff' }}>
              Browse Listings
            </Button>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  hero: {
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 50%, var(--primary-lighter) 100%)',
    padding: '120px 24px 100px',
    textAlign: 'center',
  },
  heroInner: { maxWidth: 660, margin: '0 auto' },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '8px 18px', borderRadius: 'var(--radius-full)',
    background: 'rgba(233, 69, 96, 0.12)', color: 'var(--accent)',
    fontSize: 13, fontWeight: 600, marginBottom: 28,
    backdropFilter: 'blur(8px)',
  },
  heroTitle: {
    fontSize: 56, fontWeight: 800, color: '#fff', lineHeight: 1.1,
    margin: '0 0 24px', letterSpacing: '-0.5px',
  },
  heroAccent: { color: 'var(--accent)' },
  heroSubtitle: {
    fontSize: 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.75,
    margin: 0, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto',
  },
  section: { padding: '96px 0' },
  container: { maxWidth: 1120, margin: '0 auto', padding: '0 24px' },
  testimonialsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 },
  testimonialCard: {
    padding: 32, borderRadius: 'var(--radius-xl)',
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-card)',
    display: 'flex', flexDirection: 'column', gap: 14,
    transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  quoteIcon: {
    width: 40, height: 40, borderRadius: 'var(--radius-md)',
    background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  quote: {
    fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0, flex: 1,
  },
  author: { display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 },
  avatar: {
    width: 44, height: 44, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  initials: { fontSize: 15, fontWeight: 700, color: '#fff' },
  name: { fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' },
  role: { fontSize: 13, color: 'var(--text-tertiary)', margin: 0 },
  ctaSection: {
    padding: '96px 24px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
  },
  ctaTitle: { fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 14px' },
  ctaSubtitle: {
    fontSize: 17, color: 'rgba(255,255,255,0.75)', maxWidth: 460, margin: '0 auto 36px', lineHeight: 1.7,
  },
};
