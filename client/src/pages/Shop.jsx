import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterPanel from '../components/shop/FilterPanel.jsx';
import ProductGrid from '../components/shop/ProductGrid.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { api, qs } from '../api/client.js';
import { useApi } from '../utils/useApi.js';
import './Shop.css';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price, low to high' },
  { value: 'price_desc', label: 'Price, high to low' },
  { value: 'name', label: 'Name, A to Z' },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const values = {
    category: params.get('category') || '',
    q: params.get('q') || '',
    sort: params.get('sort') || 'newest',
    min: params.get('min') || '',
    max: params.get('max') || '',
    inStock: params.get('inStock') || '',
    page: Number(params.get('page')) || 1,
  };

  const update = (patch) => {
    const next = { ...Object.fromEntries(params), ...patch };
    if (!('page' in patch)) delete next.page;
    Object.keys(next).forEach((k) => (next[k] === '' || next[k] == null) && delete next[k]);
    setParams(next);
  };
  const clear = () => setParams(values.q ? { q: values.q } : {});

  const { data: catData } = useApi(() => api('/categories'), []);
  const categories = catData?.items || [];

  const query = qs({ ...values, limit: 12 });
  const { data, loading, error } = useApi(() => api(`/products${query}`), [query]);
  const items = data?.items || [];

  const activeCategory = categories.find((c) => c.slug === values.category);
  const title = values.q ? `Results for "${values.q}"` : activeCategory ? activeCategory.name : 'All products';
  const hasFilters = Boolean(values.category || values.min || values.max || values.inStock);

  return (
    <div className="container shop">
      <header className="page-title">
        <h1>{title}</h1>
        {activeCategory?.description && !values.q && <p>{activeCategory.description}</p>}
      </header>

      <div className="shop__layout">
        <aside className={`shop__filters${showFilters ? ' is-open' : ''}`}>
          <FilterPanel categories={categories} values={values} onChange={update} onClear={clear} hasFilters={hasFilters} />
        </aside>

        <section aria-live="polite">
          <div className="shop__bar">
            <button className="shop__filter-btn" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
              <Icon name="menu" size={18} /> Filters
            </button>
            <p className="shop__count">{loading ? 'Loading...' : `${data?.total ?? 0} ${data?.total === 1 ? 'product' : 'products'}`}</p>
            <label className="shop__sort">
              <span className="sr-only">Sort by</span>
              <select className="select" value={values.sort} onChange={(e) => update({ sort: e.target.value })}>
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </div>

          {error ? (
            <p className="alert alert--error">{error.message}</p>
          ) : !loading && items.length === 0 ? (
            <EmptyState
              title="Nothing matches those filters"
              text="Try a different category or price range, or clear the filters to see everything."
              actionLabel="Clear filters"
              onAction={() => setParams({})}
            />
          ) : (
            <ProductGrid products={items} loading={loading} skeletons={6} columns={3} />
          )}

          {data && data.pages > 1 && (
            <nav className="shop__pager" aria-label="Pagination">
              <Button variant="outline" size="sm" disabled={values.page <= 1} onClick={() => update({ page: String(values.page - 1) })}>Previous</Button>
              <span>Page {data.page} of {data.pages}</span>
              <Button variant="outline" size="sm" disabled={values.page >= data.pages} onClick={() => update({ page: String(values.page + 1) })}>Next</Button>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
