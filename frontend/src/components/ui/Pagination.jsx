import './Pagination.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i);
  }

  return (
    <div className="pagination">
      <button className="page-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft size={16} />
      </button>
      {pages[0] > 1 && (
        <>
          <button className="page-btn" onClick={() => onPageChange(1)}>1</button>
          {pages[0] > 2 && <span className="page-ellipsis">...</span>}
        </>
      )}
      {pages.map(p => (
        <button key={p} className={`page-btn ${p === page ? 'page-active' : ''}`} onClick={() => onPageChange(p)}>
          {p}
        </button>
      ))}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="page-ellipsis">...</span>}
          <button className="page-btn" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
        </>
      )}
      <button className="page-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
