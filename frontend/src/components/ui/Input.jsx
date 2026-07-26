import { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(function Input({
  label, error, helperText, icon: Icon, className = '', ...props
}, ref) {
  return (
    <div className={`input-group ${error ? 'input-error' : ''} ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-wrapper">
        {Icon && <Icon size={18} className="input-icon" />}
        <input ref={ref} className={`input ${Icon ? 'input-with-icon' : ''}`} {...props} />
      </div>
      {error && <p className="input-error-text">{error}</p>}
      {helperText && !error && <p className="input-helper">{helperText}</p>}
    </div>
  );
});

export default Input;

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className={`input-group ${error ? 'input-error' : ''} ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <textarea className="input textarea" {...props} />
      {error && <p className="input-error-text">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={`input-group ${error ? 'input-error' : ''} ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-wrapper">
        <select className="input select" {...props}>{children}</select>
      </div>
      {error && <p className="input-error-text">{error}</p>}
    </div>
  );
}
