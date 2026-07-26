import './Spinner.css';

export default function Spinner({ size = 24, className = '' }) {
  return (
    <div className={`spinner-container ${className}`} style={{ width: size, height: size }}>
      <svg className="spinner-svg" viewBox="0 0 50 50" style={{ width: size, height: size }}>
        <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="var(--accent)" strokeDasharray="80 40" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="page-loader">
      <Spinner size={40} />
      <p className="page-loader-text">Loading...</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card skeleton-card">
      <div className="skeleton skeleton-card-image" />
      <div className="skeleton-card-body">
        <div className="skeleton skeleton-line-lg" />
        <div className="skeleton skeleton-line-md" />
        <div className="skeleton skeleton-line-sm" />
      </div>
    </div>
  );
}

export function SkeletonLine({ width = '100%', height = 14 }) {
  return <div className="skeleton" style={{ width, height, marginBottom: 8 }} />;
}
