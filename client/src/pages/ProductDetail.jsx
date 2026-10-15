import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductImage from '../components/ui/ProductImage.jsx';
import Price from '../components/ui/Price.jsx';
import QuantityStepper from '../components/ui/QuantityStepper.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import ProductGrid from '../components/shop/ProductGrid.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useCart } from '../context/CartContext.jsx';
import { api } from '../api/client.js';
import { useApi } from '../utils/useApi.js';
import './ProductDetail.css';

export default function ProductDetail() {
  const { slug } = useParams();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const { data, loading, error } = useApi(() => api(`/products/${slug}`), [slug]);

  useEffect(() => setQty(1), [slug]);

  if (loading) return <div className="container section"><div className="pd__loading" aria-busy="true" /></div>;
  if (error) {
    return (
      <div className="container">
        <EmptyState title="We could not find that product" text={error.message} actionLabel="Back to the shop" actionTo="/shop" />
      </div>
    );
  }

  const { product: p, related } = data;
  const soldOut = p.stock <= 0;

  return (
    <div className="container pd">
      <nav className="pd__crumbs" aria-label="Breadcrumb">
        <Link to="/shop">Shop</Link>
        <Icon name="chevron-right" size={14} />
        <Link to={`/shop?category=${p.category_slug}`}>{p.category_name}</Link>
      </nav>

      <div className="pd__grid">
        <div className="pd__media">
          <ProductImage src={p.image_url} kind={p.category_slug} alt={p.name} />
        </div>

        <div className="pd__info">
          <h1>{p.name}</h1>
          <Price price={p.price} compareAt={p.compare_at_price} size="lg" />

          <p className={`pd__stock${soldOut ? ' is-out' : ''}`}>
            {soldOut ? 'Sold out' : 'In stock'}
          </p>

          {p.description && <p className="pd__desc">{p.description}</p>}

          <div className="pd__buy">
            <QuantityStepper value={qty} max={Math.max(p.stock, 1)} onChange={setQty} />
            <Button variant="primary" size="lg" disabled={soldOut} onClick={() => add(p, qty)}>
              <Icon name="bag" size={20} /> Add to bag
            </Button>
          </div>

          <ul className="pd__notes">
            <li><Icon name="truck" size={20} /> Nationwide delivery, or pick up from Westmead Mall, Samonda, Ibadan.</li>
            <li><Icon name="shield" size={20} /> Secure payment with Paystack.</li>
            <li><Icon name="shield" size={20} /> An account is needed to place an order.</li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="pd__related">
          <SectionHeading title="You may also like" />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
