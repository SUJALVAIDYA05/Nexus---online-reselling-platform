import './Button.css';

export default function Button({
  children, variant = 'primary', size = 'md', fullWidth, loading, disabled, icon: Icon, iconRight: IconRight, className = '', ...props
}) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn-spinner" />}
      {!loading && Icon && <Icon size={size === 'sm' ? 14 : 18} />}
      {children && <span>{children}</span>}
      {!loading && IconRight && typeof IconRight === 'function' && <IconRight size={size === 'sm' ? 14 : 18} />}
    </button>
  );
}
