import './FilterPanel.css';

const PRICE_BANDS = [
  { label: 'Any price', min: '', max: '' },
  { label: 'Under ₦20,000', min: '', max: '20000' },
  { label: '₦20,000 to ₦50,000', min: '20000', max: '50000' },
  { label: '₦50,000 to ₦100,000', min: '50000', max: '100000' },
  { label: 'Over ₦100,000', min: '100000', max: '' },
];

export default function FilterPanel({ categories, values, onChange, onClear, hasFilters }) {
  const band = PRICE_BANDS.findIndex((b) => b.min === (values.min || '') && b.max === (values.max || ''));

  return (
    <div className="filters">
      <fieldset>
        <legend>Category</legend>
        <label className="filters__opt">
          <input type="radio" name="category" checked={!values.category} onChange={() => onChange({ category: '' })} />
          <span>All products</span>
        </label>
        {categories.map((c) => (
          <label key={c.id} className="filters__opt">
            <input type="radio" name="category" checked={values.category === c.slug} onChange={() => onChange({ category: c.slug })} />
            <span>{c.name}</span>
            <small>{c.product_count}</small>
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Price</legend>
        {PRICE_BANDS.map((b, i) => (
          <label key={b.label} className="filters__opt">
            <input type="radio" name="price" checked={band === i} onChange={() => onChange({ min: b.min, max: b.max })} />
            <span>{b.label}</span>
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Availability</legend>
        <label className="filters__opt">
          <input type="checkbox" checked={values.inStock === '1'} onChange={(e) => onChange({ inStock: e.target.checked ? '1' : '' })} />
          <span>In stock only</span>
        </label>
      </fieldset>

      {hasFilters && <button className="filters__clear" onClick={onClear}>Clear all filters</button>}
    </div>
  );
}
