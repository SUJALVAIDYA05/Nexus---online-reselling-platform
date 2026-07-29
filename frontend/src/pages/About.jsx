import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Star, Heart } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';

const values = [
  {
    icon: Shield,
    title: 'Trust & Safety',
    description: 'Every transaction is backed by our verification system. We verify sellers, secure payments, and protect buyers with our buyer guarantee program.',
    color: 'var(--accent)',
  },
  {
    icon: Star,
    title: 'Quality Assured',
    description: 'Our community guidelines and review system ensure that only the best quality items are listed. Bad listings get flagged, good sellers get recognized.',
    color: 'var(--warning)',
  },
  {
    icon: Heart,
    title: 'Community First',
    description: 'Built by people, for people. We believe in the power of community-driven commerce, making it easy for anyone to buy and sell with confidence.',
    color: 'var(--success)',
  },
];

const team = [
  { name: 'Arjun Mehta', role: 'Founder & CEO', initials: 'AM' },
  { name: 'Priya Sharma', role: 'Head of Product', initials: 'PS' },
  { name: 'Rohan Patel', role: 'Lead Engineer', initials: 'RP' },
  { name: 'Ananya Singh', role: 'Head of Growth', initials: 'AS' },
];

export default function About() {
  return (
    <div className="page-enter">
      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroBadge}>
            <Heart size={14} />
            <span>Our Story</span>
          </div>
          <h1 style={styles.heroTitle}>
            Reimagining the way<br />
            <span style={styles.heroAccent}>India buys & sells</span>
          </h1>
          <p style={styles.heroSubtitle}>
            NEXUS was born from a simple idea: everyone deserves a safe, fair, and enjoyable
            marketplace experience. We're building the future of peer-to-peer commerce in India.
          </p>
          <div style={styles.heroActions}>
            <Button as={Link} to="/services" variant="primary" size="lg" iconRight={ArrowRight}>
              Explore NEXUS
            </Button>
            <Button as={Link} to="/contact" variant="outline" size="lg">
              Get in Touch
            </Button>
          </div>
        </div>
      </section>

      {/* Story */}
      <section style={styles.section}>
        <div className="container" style={styles.container}>
          <div style={styles.storyGrid}>
            <div style={styles.storyContent}>
              <span style={styles.sectionTag}>Founded in 2024</span>
              <h2 style={styles.sectionTitle}>From a garage idea to<br />India's fastest growing marketplace</h2>
              <p style={styles.storyText}>
                What started as a weekend project between four college friends has grown into a
                platform trusted by thousands across India. We saw the gaps in existing marketplaces
                — the lack of trust, the complicated interfaces, the hidden fees — and we decided
                to build something better.
              </p>
              <p style={styles.storyText}>
                Today, NEXUS connects buyers and sellers in over 50 cities, processing thousands
                of listings every month. Our mission remains the same: make buying and selling
                as simple, safe, and satisfying as a conversation with a trusted friend.
              </p>
            </div>
            <div style={styles.storyVisual}>
              <div style={styles.storyCard}>
                <div style={styles.storyStat}>
                  <span style={styles.storyNumber}>2024</span>
                  <span style={styles.storyLabel}>Year Founded</span>
                </div>
                <div style={styles.storyDivider} />
                <div style={styles.storyStat}>
                  <span style={styles.storyNumber}>4</span>
                  <span style={styles.storyLabel}>Co-founders</span>
                </div>
                <div style={styles.storyDivider} />
                <div style={styles.storyStat}>
                  <span style={styles.storyNumber}>1</span>
                  <span style={styles.storyLabel}>Mission</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section style={{ ...styles.section, background: 'var(--bg-secondary)' }}>
        <div className="container" style={styles.container}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTag}>What We Stand For</span>
            <h2 style={styles.sectionTitle}>Our Mission & Values</h2>
            <p style={styles.sectionDesc}>
              Everything we build is guided by our core values. They're not just words on a page —
              they're promises we keep every day.
            </p>
          </div>
          <div style={styles.valuesGrid}>
            {values.map((val, i) => (
              <Card key={i} hover style={{ animation: `slideUp 0.4s ease ${0.1 * i}s both` }}>
                <CardBody>
                  <div style={{ ...styles.valueIcon, background: `${val.color}15` }}>
                    <val.icon size={28} color={val.color} />
                  </div>
                  <h3 style={styles.valueTitle}>{val.title}</h3>
                  <p style={styles.valueDesc}>{val.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ ...styles.section, background: 'var(--bg-secondary)' }}>
        <div className="container" style={styles.container}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTag}>The People Behind NEXUS</span>
            <h2 style={styles.sectionTitle}>Meet Our Team</h2>
            <p style={styles.sectionDesc}>
              A passionate team working tirelessly to redefine online commerce in India.
            </p>
          </div>
          <div style={styles.teamGrid}>
            {team.map((member, i) => (
              <div key={i} style={{ ...styles.teamCard, animation: `slideUp 0.4s ease ${0.1 * i}s both` }}>
                <div style={styles.teamAvatar}>
                  <span style={styles.teamInitials}>{member.initials}</span>
                </div>
                <h4 style={styles.teamName}>{member.name}</h4>
                <p style={styles.teamRole}>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={styles.ctaTitle}>Ready to join the NEXUS community?</h2>
          <p style={styles.ctaSubtitle}>
            Whether you're looking to sell your first item or your hundredth, NEXUS is here for you.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button as={Link} to="/signup" variant="primary" size="lg" iconRight={ArrowRight}>
              Get Started Free
            </Button>
            <Button as={Link} to="/browse" variant="ghost" size="lg">
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
    position: 'relative',
    overflow: 'hidden',
  },
  heroInner: { maxWidth: 720, margin: '0 auto', position: 'relative', zIndex: 1 },
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
    margin: '0 0 36px', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto',
  },
  heroActions: { display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' },
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
    fontSize: 16, color: 'var(--text-secondary)', maxWidth: 560,
    margin: '0 auto', lineHeight: 1.7,
  },
  storyGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center',
  },
  storyContent: {},
  storyText: { fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.8, margin: '0 0 18px' },
  storyVisual: {},
  storyCard: {
    display: 'flex', flexDirection: 'column', gap: 28,
    padding: 44, borderRadius: 'var(--radius-2xl)',
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-card)',
  },
  storyStat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  storyNumber: { fontSize: 40, fontWeight: 900, color: 'var(--accent)' },
  storyLabel: { fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 500 },
  storyDivider: { height: 1, background: 'var(--border)', opacity: 0.6 },
  valuesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 },
  valueIcon: {
    width: 60, height: 60, borderRadius: 'var(--radius-xl)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  valueTitle: { fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' },
  valueDesc: { fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 },
  teamGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 },
  teamCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '36px 20px', borderRadius: 'var(--radius-xl)',
    background: 'var(--bg)', border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-card)',
    transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  teamAvatar: {
    width: 76, height: 76, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent), var(--primary))',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    boxShadow: '0 4px 16px rgba(233, 69, 96, 0.2)',
  },
  teamInitials: { fontSize: 26, fontWeight: 700, color: '#fff' },
  teamName: { fontSize: 17, fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' },
  teamRole: { fontSize: 14, color: 'var(--text-tertiary)', margin: 0 },
  ctaSection: {
    padding: '96px 24px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
  },
  ctaTitle: {
    fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 14px',
  },
  ctaSubtitle: {
    fontSize: 17, color: 'rgba(255,255,255,0.75)', marginBottom: 36,
    maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.7,
  },
};
