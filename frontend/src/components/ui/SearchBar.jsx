import { Search } from 'lucide-react';
import './SearchBar.css';

export default function SearchBar({ value, onChange, placeholder = 'Search...', onSubmit, className = '' }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form className={`search-bar ${className}`} onSubmit={handleSubmit}>
      <Search size={18} className="search-icon" />
      <input
        type="text"
        className="search-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </form>
  );
}
