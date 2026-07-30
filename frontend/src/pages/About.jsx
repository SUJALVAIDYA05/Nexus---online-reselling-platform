import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Star, Heart } from 'lucide-react';
import Button from '../components/ui/Button';
import PageTransition from '../components/ui/PageTransition';

const values = [
  {
    icon: Shield,
    title: 'Trust & Safety',
    description: 'Every transaction is backed by our verification system. We verify sellers, secure payments, and protect buyers.',
    color: '#f43f5e',
  },
  {
    icon: Star,
    title: 'Quality Assured',
    description: 'Community guidelines and review systems ensure high quality pre-owned goods are listed transparently.',
    color: '#f59e0b',
  },
  {
    icon: Heart,
    title: 'Community First',
    description: 'Built by people, for people. We believe in peer-to-peer commerce that empowers sellers and delights buyers.',
    color: '#10b981',
  },
];

const team = [
  { name: 'Arjun Mehta', role: 'Founder & CEO', initials: 'AM' },
  { name: 'Priya Sharma', role: 'Head of Product', initials: 'PS' },
  { name: 'Rohan Patel', role: 'Lead Engineer', initials: 'RP' },
  { name: 'Ananya Singh', role: 'Head of Growth', initials: 'AS' },
];

const styles = `
  .abt-hero { padding: 90px 24px; text-align: center; background: radial-gradient(circle at 50% 30%, #1e293b 0%, #0f172a 100%); }
  .abt-title { font-size: clamp(34px, 5.5vw, 56px); font-weight: 900; color: #ffffff; letter-spacing: -1.5px; margin-bottom: 20px; }
  .abt-accent { background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .abt-sub { font-size: 18px; color: var(--text-secondary); max-width: 620px; margin: 0 auto 36px; line-height: 1.7; }

  .abt-sec { padding: 80px 24px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
  .val-card { background: var(--bg-glass); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: var(--radius-2xl); padding: 36px; }

  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
  .team-card { background: var(--bg-glass); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 32px 20px; text-align: center; }
  .team-avatar { width: 72px; height: 72px; border-radius: 50%; background: var(--gradient-primary); color: white; font-weight: 800; font-size: 24px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }

  @media (max-width: 992px) {
    .grid-3, .grid-4 { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 600px) {
    .grid-3, .grid-4 { grid-template-columns: 1fr; }
  }
`;

export default function About() {
  return (
    <PageTransition>
      <style>{styles}</style>
      <div>
        <section className="abt-hero">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="abt-title">
              Reimagining How India<br />
              <span className="abt-accent">Buys & Sells Pre-Loved Goods</span>
            </h1>
            <p className="abt-sub">
              NEXUS is built on a simple promise: make peer-to-peer reselling safe, transparent, and enjoyable for everyone.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Link to="/browse">
                <Button size="lg" iconRight={ArrowRight}>Explore Platform</Button>
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="abt-sec">
          <div className="container">
            <h2 style={{ fontSize: 30, fontWeight: 800, color: '#ffffff', textAlign: 'center', marginBottom: 40 }}>Our Core Principles</h2>
            <div className="grid-3">
              {values.map((val, i) => (
                <motion.div 
                  key={i} 
                  className="val-card"
                  whileHover={{ y: -6 }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: `${val.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <val.icon size={26} color={val.color} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginBottom: 12 }}>{val.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 15 }}>{val.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="abt-sec" style={{ background: 'var(--bg-secondary)' }}>
          <div className="container">
            <h2 style={{ fontSize: 30, fontWeight: 800, color: '#ffffff', textAlign: 'center', marginBottom: 40 }}>Meet the Team</h2>
            <div className="grid-4">
              {team.map((member, i) => (
                <motion.div 
                  key={i} 
                  className="team-card"
                  whileHover={{ y: -4 }}
                >
                  <div className="team-avatar">{member.initials}</div>
                  <h4 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>{member.name}</h4>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{member.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
