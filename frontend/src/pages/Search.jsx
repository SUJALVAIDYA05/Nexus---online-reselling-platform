import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, X, ArrowUpDown, RotateCcw,
} from 'lucide-react';
import SearchBar from '../components/ui/SearchBar';
import ListingCard from '../components/listing/ListingCard';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import PageTransition from '../components/ui/PageTransition';
import { listings, categories } from '../api/api';

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

const pageStyles = `
  .sp-page { padding: 40px 0 80px; }
  .sp-container { max-width: var(--container); margin: 0 auto; padding: 0 24px; }
  .sp-hero { margin-bottom: 32px; text-align: center; }
  .sp-hero-title { font-size: clamp(28px, 4vw, 40px); font-weight: 800; color: #ffffff; margin-bottom: 8px; }
  .sp-hero-sub { color: var(--text-secondary); font-size: 16px; }
  .sp-search-row { display: flex; gap: 16px; align-items: center; margin-bottom: 24px; }
  .sp-search-bar { flex: 1; }
  .sp-sort-desktop { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); padding: 0 14px; border-radius: var(--radius-md); }
  .sp-sort-icon { color: var(--text-tertiary); }
  .sp-select { background: transparent; color: #ffffff; border: none; padding: 12px 8px; outline: none; font-size: 14px; cursor: pointer; }
  .sp-select option { background: var(--bg-secondary); color: #ffffff; }
  
  .sp-active-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
  .sp-active-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(244,63,94,0.15); border: 1px solid rgba(244,63,94,0.3); border-radius: var(--radius-full); color: #ffffff; font-size: 13px; font-weight: 500; }
  .sp-active-chip button { color: var(--accent); display: flex; align-items: center; cursor: pointer; }

  .sp-body { display: grid; grid-template-columns: 260px 1fr; gap: 32px; }
  .sp-sidebar { background: var(--bg-glass); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 24px; height: fit-content; backdrop-filter: blur(16px); }
  .sp-filter-header { display: flex; align-items: center; justify-content: space-between; font-weight: 700; color: #ffffff; margin-bottom: 20px; font-size: 16px; border-bottom: 1px solid var(--border-light); padding-bottom: 12px; }
  .sp-filter-reset { color: var(--accent); font-size: 12px; display: flex; align-items: center; gap: 4px; font-weight: 600; cursor: pointer; }
  .sp-filter-group { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
  .sp-filter-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
  .sp-input { background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 10px 14px; color: #ffffff; font-size: 14px; width: 100%; outline: none; transition: border-color 0.2s; }
  .sp-input:focus { border-color: var(--accent); }
  .sp-price-range { display: flex; align-items: center; gap: 8px; }
  .sp-price-sep { color: var(--text-tertiary); }

  .sp-results-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .sp-results-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; color: var(--text-secondary); font-size: 14px; }

  .sp-mobile-filter-bar { display: none; margin-bottom: 16px; }
  .sp-mobile-filter-btn { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); padding: 10px 18px; border-radius: var(--radius-md); color: #ffffff; font-weight: 600; }

  @media (max-width: 992px) {
    .sp-body { grid-template-columns: 1fr; }
    .sp-sidebar { display: none; }
    .sp-results-grid { grid-template-columns: repeat(2, 1fr); }
    .sp-mobile-filter-bar { display: flex; justify-content: space-between; }
    .sp-sort-desktop { display: none; }
  }
  @media (max-width: 600px) {
    .sp-results-grid { grid-template-columns: 1fr; }
  }
`;

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

  const FilterPanel = () => (
    <div className="sp-filter-panel">
      <div className="sp-filter-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={16} />
          <span>Filter Products</span>
        </div>
        {hasActiveFilters && (
          <button className="sp-filter-reset" onClick={handleReset}>
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </div>

      <div className="sp-filter-group">
        <label className="sp-filter-label">Category</label>
        <select
          className="sp-input"
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
        <label className="sp-filter-label">Price Range (₹)</label>
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
          className="sp-input"
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
    <PageTransition>
      <style>{pageStyles}</style>
      <div className="sp-page">
        <div className="sp-container">
          <div className="sp-hero">
            <h1 className="sp-hero-title">Browse Marketplace</h1>
            <p className="sp-hero-sub">Discover verified deals on pre-owned items near you</p>
          </div>

          <div className="sp-search-row">
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={handleSearch}
              placeholder="Search by keyword, brand, or product title..."
              className="sp-search-bar"
            />
            <div className="sp-sort-desktop">
              <ArrowUpDown size={14} className="sp-sort-icon" />
              <select
                className="sp-select"
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

          <div className="sp-mobile-filter-bar">
            <button className="sp-mobile-filter-btn" onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}>
              <SlidersHorizontal size={16} /> Filters
            </button>
            <select
              className="sp-input"
              style={{ width: 'auto' }}
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1); }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {mobileFiltersOpen && (
            <div style={{ marginBottom: 24 }} className="sp-sidebar">
              <FilterPanel />
            </div>
          )}

          <div className="sp-body">
            <aside className="sp-sidebar">
              <FilterPanel />
            </aside>

            <div className="sp-main">
              <div className="sp-results-header">
                <span>Showing <strong>{total}</strong> listings</span>
              </div>

              {loading ? (
                <div className="sp-results-grid">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 320, borderRadius: 'var(--radius-xl)' }} />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <EmptyState
                  title="No listings found"
                  description="Try clearing your filters or searching for something else."
                  actionText="Clear Filters"
                  onAction={handleReset}
                />
              ) : (
                <motion.div 
                  className="sp-results-grid"
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
                  }}
                >
                  {results.map(item => (
                    <ListingCard
                      key={item._id}
                      listing={item}
                    />
                  ))}
                </motion.div>
              )}

              {totalPages > 1 && (
                <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
