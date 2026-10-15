import ProductCard from './ProductCard.jsx';
import './ProductGrid.css';

export default function ProductGrid({ products, loading, skeletons = 8, columns }) {
  const style = columns ? { '--cols': columns } : undefined;
  if (loading) {
    return (
      <div className="pgrid" style={style} aria-busy="true">
        {Array.from({ length: skeletons }, (_, i) => (
          <div key={i} className="pgrid__skeleton"><div /><span /><span /></div>
        ))}
      </div>
    );
  }
  return (
    <div className="pgrid" style={style}>
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
