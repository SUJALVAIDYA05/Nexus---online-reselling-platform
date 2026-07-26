import { Link } from 'react-router-dom';
import { ArrowRight, Camera, Search, CreditCard, Truck, CheckCircle2, Shield, Zap, Headphones } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';

const services = [
  {
    icon: Camera,
    title: 'List Your Items',
    description: 'Snap a photo, add details, set your price. Our smart listing tool makes it easy to get your items in front of thousands of potential buyers within minutes.',
    color: 'var(--accent)',
  },
  {
    icon: Search,
    title: 'Browse & Buy',
    description: 'Discover amazing deals on thousands of items across dozens of categories. Advanced filters and smart search help you find exactly what you need.',
    color: 'var(--info)',
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description: 'Our escrow-based payment system holds funds safely until the buyer confirms receipt. Both parties are protected, every single time.',
    color: 'var(--success)',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Integrated logistics with leading courier partners across India. Real-time tracking ensures you always know where your package is.',
    color: 'var(--warning)',
  },
];

const steps = [
  {
    number: '01',
    title: 'Create an Account',
    description: 'Sign up in under a minute with your email or phone number. Complete your profile to build trust with other users.',
  },
  {
    number: '02',
    title: 'List or Search',
    description: 'Sellers can list items with photos and details. Buyers can browse, filter, and find exactly what they are looking for.',
  },
  {
    number: '03',
    title: 'Connect & Negotiate',
    description: 'Message directly with buyers or sellers. Ask questions, negotiate price, and agree on terms through our secure chat.',
  },
  {
    number: '04',
    title: 'Transact Safely',
    description: 'Complete your purchase through our secure payment system. Funds are held in escrow until both parties are satisfied.',
  },
];

const features = [
  { icon: Shield, title: 'Buyer Protection', desc: 'Full refund if item is not as described' },
  { icon: Zap, title: 'Instant Listings', desc: 'Go live in under 60 seconds' },
  { icon: Headphones, title: '24/7 Support', desc: 'Help whenever you need it' },
];

export default function Services() {
  return (
    <div className="page-enter">
      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroBadge}>
            <Zap size={14} />
            <span>Our Services</span>
          </div>
          <h1 style={styles.heroTitle}>
            Everything you need to<br />
            <span style={styles.heroAccent}>buy & sell with confidence</span>
          </h1>
          <p style={styles.heroSubtitle}>
            From listing to delivery, NEXUS provides a complete marketplace experience
            designed for safety, speed, and simplicity.
          </p>
          <Button as={Link} to="/browse" variant="primary" size="lg" iconRight={ArrowRight}>
            Start Browsing
          </Button>
        </div>
      </section>

      {/* Service Cards */}
      <section style={styles.section}>
        <div className="container" style={styles.container}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTag}>What We Offer</span>
            <h2 style={styles.sectionTitle}>A complete marketplace solution</h2>
            <p style={styles.sectionDesc}>
              Whether you're a first-time seller or a seasoned buyer, we've got you covered.
            </p>
          </div>
          <div style={styles.servicesGrid}>
            {services.map((service, i) => (
              <Card key={i} hover style={{ animation: `slideUp 0.4s ease ${0.1 * i}s both` }}>
                <CardBody>
                  <div style={{ ...styles.serviceIcon, background: `${service.color}15` }}>
                    <service.icon size={28} color={service.color} />
                  </div>
                  <h3 style={styles.serviceTitle}>{service.title}</h3>
                  <p style={styles.serviceDesc}>{service.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ ...styles.section, background: 'var(--bg-secondary)' }}>
        <div className="container" style={styles.container}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTag}>How It Works</span>
            <h2 style={styles.sectionTitle}>Four simple steps to get started</h2>
            <p style={styles.sectionDesc}>
              Getting started on NEXUS is easy. Here's how it works.
            </p>
          </div>
          <div style={styles.stepsGrid}>
            {steps.map((step, i) => (
              <div key={i} style={{ ...styles.stepCard, animation: `slideUp 0.4s ease ${0.15 * i}s both` }}>
                <div style={styles.stepNumber}>{step.number}</div>
                <div style={styles.stepConnector} />
                <div>
                  <h3 style={styles.stepTitle}>{step.title}</h3>
                  <p style={styles.stepDesc}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={styles.section}>
        <div className="container" style={styles.container}>
          <div style={styles.featuresRow}>
            {features.map((feat, i) => (
              <div key={i} style={{ ...styles.featureItem, animation: `slideUp 0.4s ease ${0.1 * i}s both` }}>
                <feat.icon size={24} color="var(--accent)" />
                <div>
                  <p style={styles.featureTitle}>{feat.title}</p>
                  <p style={styles.featureDesc}>{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={styles.ctaTitle}>Ready to get started?</h2>
          <p style={styles.ctaSubtitle}>
            Join thousands of Indians who are already buying and selling on NEXUS.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button as={Link} to="/signup" variant="primary" size="lg" iconRight={ArrowRight}>
              Create Free Account
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
  heroInner: { maxWidth: 700, margin: '0 auto' },
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
    margin: '0 0 36px', maxWidth: 540, marginLeft: 'auto', marginRight: 'auto',
  },
  section: { padding: '96px 0' },
  container: { maxWidth: 1120, margin: '0 auto', padding: '0 24px' },
  sectionHeader: { textAlign: 'center', marginBottom: 56 },
  sectionTag: {
    display: 'inline-block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '1.5px', color: 'var(--accent)', marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 36, fontWeight: 800, color: 'var(--text)', margin: '0 0 14px', lineHeight: 1.2,
  },
  sectionDesc: {
    fontSize: 16, color: 'var(--text-secondary)', maxWidth: 540,
    margin: '0 auto', lineHeight: 1.7,
  },
  servicesGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28 },
  serviceIcon: {
    width: 60, height: 60, borderRadius: 'var(--radius-xl)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  serviceTitle: { fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' },
  serviceDesc: { fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 },
  stepsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28,
  },
  stepCard: {
    display: 'flex', gap: 24, alignItems: 'flex-start',
    padding: 32, borderRadius: 'var(--radius-xl)',
    background: 'var(--bg)', border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-card)',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
  },
  stepNumber: {
    fontSize: 32, fontWeight: 900, color: 'var(--accent)', opacity: 0.25,
    lineHeight: 1, flexShrink: 0,
  },
  stepConnector: { display: 'none' },
  stepTitle: { fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' },
  stepDesc: { fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 },
  featuresRow: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 36,
    padding: '36px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
  },
  featureItem: { display: 'flex', alignItems: 'center', gap: 16 },
  featureTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' },
  featureDesc: { fontSize: 14, color: 'var(--text-secondary)', margin: 0 },
  ctaSection: {
    padding: '96px 24px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
  },
  ctaTitle: { fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 14px' },
  ctaSubtitle: {
    fontSize: 17, color: 'rgba(255,255,255,0.75)', maxWidth: 460, margin: '0 auto 36px', lineHeight: 1.7,
  },
};
