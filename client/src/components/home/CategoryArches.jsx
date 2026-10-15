import { Link } from 'react-router-dom';
import ProductImage from '../ui/ProductImage.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import { api } from '../../api/client.js';
import { useApi } from '../../utils/useApi.js';
import './CategoryArches.css';

export default function CategoryArches() {
  const { data, loading } = useApi(() => api('/categories'), []);
  const cats = data?.items || [];

  return (
    <section className="section">
      <div className="container">
        <SectionHeading title="Everything for the table and the kitchen" text="Start with a category, or browse the whole collection." />
        <ul className="arches">
          {loading
            ? Array.from({ length: 6 }, (_, i) => <li key={i} className="arches__ghost" />)
            : cats.map((c) => (
                <li key={c.id}>
                  <Link to={`/shop?category=${c.slug}`} className="arch">
                    <div className="arch__shape"><ProductImage src={c.image_url} kind={c.slug} alt={c.name} /></div>
                    <span className="arch__name">{c.name}</span>
                    <span className="arch__count">{c.product_count} {c.product_count === 1 ? 'piece' : 'pieces'}</span>
                  </Link>
                </li>
              ))}
        </ul>
      </div>
    </section>
  );
}
