import ProductGrid from '../shop/ProductGrid.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import Button from '../ui/Button.jsx';
import { api } from '../../api/client.js';
import { useApi } from '../../utils/useApi.js';

export default function FeaturedProducts() {
  const { data, loading, error } = useApi(() => api('/products?featured=1&limit=8'), []);
  const items = data?.items || [];

  if (!loading && !error && items.length === 0) return null;

  return (
    <section className="section" style={{ background: 'var(--white)', borderBlock: '1px solid var(--line)' }}>
      <div className="container">
        <SectionHeading
          title="Featured pieces"
          text="The ones our customers ask for first."
          action={<Button to="/shop" variant="outline">View all products</Button>}
        />
        {error ? <p className="alert alert--error">{error.message}</p> : <ProductGrid products={items} loading={loading} skeletons={8} />}
      </div>
    </section>
  );
}
