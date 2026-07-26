import './Badge.css';

export default function Badge({ children, variant = 'default', size = 'sm', dot }) {
  return (
    <span className={`badge badge-${variant} badge-${size}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}
