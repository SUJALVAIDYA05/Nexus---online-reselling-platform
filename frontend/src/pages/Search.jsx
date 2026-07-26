import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SlidersHorizontal, X, ChevronDown, ArrowUpDown,
  Package, RotateCcw,
} from 'lucide-react';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import { Select } from '../components/ui/Input';
import ListingCard from '../components/listing/ListingCard';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { listings, categories, favorites } from '../api/api';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
];

const CONDITION_OPTIONS = [
  { value: '', label: 'All Conditions' },
  { value: 'new', label: 'Brand New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [allCategories, setAllCategories] = useState([]);
  const [favIds, setFavIds] = useState(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    categories.list().then(data => {
      setAllCategories(data.categories || data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    const params = {};
    if (query) params.q = query;
    if (category) params.category = category;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (location) params.location = location;
    if (condition) params.condition = condition;
    if (sort) params.sort = sort;
    params.page = page;
    params.limit = 12;

    listings.list(params).then(data => {
      if (cancelled || controller.signal.aborted) return;
      setResults(data.listings || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setLoading(false);
    }).catch(() => {
      if (!cancelled && !controller.signal.aborted) {
        setResults([]);
        setTotal(0);
        setLoading(false);
      }
    });

    return () => { cancelled = true; controller.abort(); };
  }, [query, category, minPrice, maxPrice, location, sort, page]);

  useEffect(() => {
    favorites.list().then(data => {
      const favs = data.favorites || data;
      setFavIds(new Set(favs.map(f => typeof f.listing === 'object' ? f.listing._id : f.listing)));
    }).catch(() => {});
  }, [results]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (location) params.set('location', location);
    if (condition) params.set('condition', condition);
    if (sort && sort !== 'newest') params.set('sort', sort);
    if (page > 1) params.set('page', page.toString());
    setSearchParams(params, { replace: true });
  }, [query, category, minPrice, maxPrice, location, sort, page, setSearchParams]);

  const handleSearch = useCallback((val) => {
    setQuery(val);
    setPage(1);
  }, []);

  const handleFavorite = useCallback(async (listingId) => {
    const wasFav = favIds.has(listingId);
    setFavIds(prev => {
      const next = new Set(prev);
      wasFav ? next.delete(listingId) : next.add(listingId);
      return next;
    });
    try {
      wasFav ? await favorites.remove(listingId) : await favorites.add(listingId);
    } catch {
      setFavIds(prev => {
        const next = new Set(prev);
        wasFav ? next.add(listingId) : next.delete(listingId);
        return next;
      });
    }
  }, [favIds]);

  const handleReset = useCallback(() => {
    setQuery('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setLocation('');
    setCondition('');
    setSort('newest');
    setPage(1);
  }, []);

  const hasActiveFilters = category || minPrice || maxPrice || location || condition;

  const FilterPanel = ({ mobile = false }) => (
    <div className={`sp-filters ${mobile ? 'sp-filters-mobile' : ''}`}>
      <div className="sp-filter-header">
        <SlidersHorizontal size={16} />
        <span>Filters</span>
        {hasActiveFilters && (
          <button className="sp-filter-reset" onClick={handleReset}>
            <RotateCcw size={13} /> Clear
          </button>
        )}
      </div>

      <div className="sp-filter-group">
        <label className="sp-filter-label">Category</label>
        <select
          className="sp-select"
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {allCategories.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="sp-filter-group">
        <label className="sp-filter-label">Price Range</label>
        <div className="sp-price-range">
          <input
            type="number"
            className="sp-input"
            placeholder="Min"
            value={minPrice}
            onChange={e => { setMinPrice(e.target.value); setPage(1); }}
            min="0"
          />
          <span className="sp-price-sep">–</span>
          <input
            type="number"
            className="sp-input"
            placeholder="Max"
            value={maxPrice}
            onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
            min="0"
          />
        </div>
      </div>

      <div className="sp-filter-group">
        <label className="sp-filter-label">Location</label>
        <input
          type="text"
          className="sp-input"
          placeholder="City or area..."
          value={location}
          onChange={e => { setLocation(e.target.value); setPage(1); }}
        />
      </div>

      <div className="sp-filter-group">
        <label className="sp-filter-label">Condition</label>
        <select
          className="sp-select"
          value={condition}
          onChange={e => { setCondition(e.target.value); setPage(1); }}
        >
          {CONDITION_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="sp-page">
      <div className="sp-container">
        <div className="sp-hero">
          <h1 className="sp-hero-title">Find What You Need</h1>
          <p className="sp-hero-sub">Browse thousands of quality pre-owned items</p>
        </div>

        <div className="sp-search-row">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={handleSearch}
            placeholder="Search for electronics, fashion, home goods..."
            className="sp-search-bar"
          />
          <div className="sp-sort-desktop">
            <ArrowUpDown size={14} className="sp-sort-icon" />
            <select
              className="sp-select sp-sort-select"
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1); }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="sp-active-filters">
            {category && (
              <span className="sp-active-chip">
                {allCategories.find(c => c._id === category)?.name || category}
                <button onClick={() => setCategory('')}><X size={12} /></button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="sp-active-chip">
                ₹{minPrice || '0'} – ₹{maxPrice || '∞'}
                <button onClick={() => { setMinPrice(''); setMaxPrice(''); }}><X size={12} /></button>
              </span>
            )}
            {location && (
              <span className="sp-active-chip">
                {location}
                <button onClick={() => setLocation('')}><X size={12} /></button>
              </span>
            )}
            {condition && (
              <span className="sp-active-chip">
                {CONDITION_OPTIONS.find(o => o.value === condition)?.label}
                <button onClick={() => setCondition('')}><X size={12} /></button>
              </span>
            )}
          </div>
        )}

        <div className="sp-body">
          <aside className="sp-sidebar">
            <FilterPanel />
          </aside>

          <div className="sp-mobile-filter-bar">
            <button className="sp-mobile-filter-btn" onClick={() => setMobileFiltersOpen(true)}>
              <SlidersHorizontal size={16} />
              Filters
              {hasActiveFilters && <span className="sp-filter-count">{[category, minPrice || maxPrice, location, condition].filter(Boolean).length}</span>}
            </button>
            <select
              className="sp-select sp-sort-select-mobile"
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1); }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <main className="sp-results">
            <div className="sp-results-header">
              <span className="sp-results-count">
                {loading ? 'Searching...' : `${total} ${total === 1 ? 'result' : 'results'} found`}
              </span>
            </div>

            {loading ? (
              <div className="sp-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="sp-skeleton-card">
                    <div className="skeleton" style={{ height: 180, borderRadius: 0 }} />
                    <div style={{ padding: 16 }}>
                      <div className="skeleton" style={{ height: 14, width: '85%', marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 20, width: '45%', marginBottom: 10 }} />
                      <div className="skeleton" style={{ height: 12, width: '60%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No listings found"
                description="Try adjusting your filters or search terms to find what you're looking for."
                action={
                  <Button variant="secondary" icon={RotateCcw} onClick={handleReset}>
                    Clear All Filters
                  </Button>
                }
              />
            ) : (
              <>
                <div className="sp-grid">
                  {results.map(listing => (
                    <ListingCard
                      key={listing._id}
                      listing={listing}
                      isFavorited={favIds.has(listing._id)}
                      onFavorite={handleFavorite}
                    />
                  ))}
                </div>
                <div className="sp-pagination">
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="sp-mobile-overlay" onClick={() => setMobileFiltersOpen(false)}>
          <div className="sp-mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="sp-mobile-drawer-header">
              <h3>Filters</h3>
              <button className="sp-mobile-close" onClick={() => setMobileFiltersOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="sp-mobile-drawer-body">
              <FilterPanel mobile />
            </div>
            <div className="sp-mobile-drawer-footer">
              <Button variant="ghost" fullWidth onClick={handleReset}>Reset</Button>
              <Button variant="primary" fullWidth onClick={() => setMobileFiltersOpen(false)}>
                Show Results
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .sp-page { animation: fadeIn 0.35s ease; min-height: 70vh; }
  .sp-container { max-width: var(--container); margin: 0 auto; padding: 0 24px 60px; }

  .sp-hero { text-align: center; padding: 40px 0 8px; }
  .sp-hero-title {
    font-size: 32px; font-weight: 800; color: var(--text);
    letter-spacing: -0.5px; margin-bottom: 6px;
  }
  .sp-hero-sub { font-size: 15px; color: var(--text-tertiary); }

  .sp-search-row {
    display: flex; align-items: center; gap: 12px;
    max-width: 680px; margin: 20px auto 0;
  }
  .sp-search-bar { flex: 1; }
  .sp-sort-desktop { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .sp-sort-icon { color: var(--text-tertiary); }
  .sp-sort-select {
    background: var(--bg-secondary); border: 1px solid var(--border);
    border-radius: var(--radius-md); padding: 10px 12px; font-size: 13px;
    color: var(--text); cursor: pointer; outline: none;
    transition: border-color var(--transition);
  }
  .sp-sort-select:focus { border-color: var(--accent); }

  .sp-active-filters {
    display: flex; flex-wrap: wrap; gap: 8px;
    max-width: 680px; margin: 14px auto 0;
  }
  .sp-active-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px; background: var(--accent-light);
    color: var(--accent); font-size: 12px; font-weight: 600;
    border-radius: var(--radius-full);
  }
  .sp-active-chip button {
    background: none; border: none; color: var(--accent);
    cursor: pointer; display: flex; padding: 0;
    opacity: 0.7; transition: opacity var(--transition);
  }
  .sp-active-chip button:hover { opacity: 1; }

  .sp-body {
    display: grid; grid-template-columns: 240px 1fr; gap: 28px;
    margin-top: 28px; align-items: start;
  }

  .sp-sidebar { position: sticky; top: calc(var(--nav-height, 72px) + 20px); }
  .sp-filters {
    background: var(--bg-secondary); border: 1px solid var(--border-light);
    border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm);
  }
  .sp-filter-header {
    display: flex; align-items: center; gap: 8px;
    font-size: 14px; font-weight: 700; color: var(--text);
    margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid var(--border-light);
  }
  .sp-filter-reset {
    margin-left: auto; background: none; border: none;
    color: var(--accent); font-size: 12px; font-weight: 600;
    cursor: pointer; display: flex; align-items: center; gap: 4px;
    transition: opacity var(--transition);
  }
  .sp-filter-reset:hover { opacity: 0.8; }

  .sp-filter-group { margin-bottom: 16px; }
  .sp-filter-group:last-child { margin-bottom: 0; }
  .sp-filter-label {
    display: block; font-size: 11px; font-weight: 700; color: var(--text-tertiary);
    text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px;
  }
  .sp-select, .sp-input {
    width: 100%; padding: 9px 12px; font-size: 13px; color: var(--text);
    background: var(--bg); border: 1px solid var(--border);
    border-radius: var(--radius-sm); outline: none;
    transition: border-color var(--transition), box-shadow var(--transition);
  }
  .sp-select:focus, .sp-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-light);
  }
  .sp-select { cursor: pointer; appearance: auto; }

  .sp-price-range { display: flex; align-items: center; gap: 8px; }
  .sp-price-sep { color: var(--text-tertiary); font-weight: 500; }
  .sp-price-range .sp-input { flex: 1; }

  .sp-mobile-filter-bar { display: none; }
  .sp-mobile-filter-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 16px; background: var(--bg-secondary); border: 1px solid var(--border);
    border-radius: var(--radius-md); font-size: 13px; font-weight: 600;
    color: var(--text); cursor: pointer; transition: all var(--transition);
  }
  .sp-mobile-filter-btn:hover { border-color: var(--text-tertiary); }
  .sp-filter-count {
    width: 20px; height: 20px; border-radius: var(--radius-full);
    background: var(--accent); color: white; font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
  }
  .sp-sort-select-mobile { flex: 1; }

  .sp-results-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 16px;
  }
  .sp-results-count { font-size: 14px; color: var(--text-secondary); font-weight: 500; }

  .sp-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
  }
  .sp-skeleton-card {
    background: var(--bg-secondary); border: 1px solid var(--border-light);
    border-radius: var(--radius-lg); overflow: hidden;
  }

  .sp-pagination {
    display: flex; justify-content: center; margin-top: 32px;
  }

  .sp-mobile-overlay {
    position: fixed; inset: 0; z-index: 9998;
    background: rgba(0,0,0,0.5); animation: fadeIn 0.2s ease;
    display: flex; align-items: flex-end; justify-content: center;
  }
  .sp-mobile-drawer {
    width: 100%; max-width: 420px; max-height: 85vh;
    background: var(--bg-secondary); border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    display: flex; flex-direction: column;
    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .sp-mobile-drawer-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 20px 0; font-size: 18px; font-weight: 700; color: var(--text);
  }
  .sp-mobile-close {
    width: 36px; height: 36px; border-radius: var(--radius-full);
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-tertiary); color: var(--text-secondary);
    border: none; cursor: pointer; transition: all var(--transition);
  }
  .sp-mobile-close:hover { background: var(--border); }
  .sp-mobile-drawer-body { flex: 1; overflow-y: auto; padding: 16px 20px; }
  .sp-mobile-drawer-body .sp-filters { border: none; box-shadow: none; padding: 0; border-radius: 0; }
  .sp-mobile-drawer-footer {
    display: flex; gap: 10px; padding: 16px 20px;
    border-top: 1px solid var(--border-light);
  }

  @media (max-width: 960px) {
    .sp-grid { grid-template-columns: repeat(2, 1fr); }
    .sp-sidebar { display: none; }
    .sp-mobile-filter-bar { display: flex; margin-top: 20px; }
    .sp-sort-desktop { display: none; }
  }
  @media (max-width: 540px) {
    .sp-grid { grid-template-columns: 1fr; }
    .sp-hero { padding: 24px 0 4px; }
    .sp-hero-title { font-size: 24px; }
    .sp-container { padding: 0 16px 40px; }
    .sp-search-row { flex-direction: column; gap: 10px; }
    .sp-search-row .sp-search-bar { width: 100%; }
  }
`;
