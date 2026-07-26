import './Card.css';

export function Card({ children, className = '', hover, padding, ...props }) {
  return (
    <div
      className={`card ${hover ? 'card-hover' : ''} ${padding === 'none' ? 'card-no-pad' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`card-header ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }) {
  return <div className={`card-body ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`card-footer ${className}`}>{children}</div>;
}
