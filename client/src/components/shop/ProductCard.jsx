import { Link } from 'react-router-dom';
import ProductImage from '../ui/ProductImage.jsx';
import Price from '../ui/Price.jsx';
import Icon from '../ui/Icon.jsx';
import { useCart } from '../../context/CartContext.jsx';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const soldOut = product.stock <= 0;
  const onSale = product.compare_at_price && product.compare_at_price > product.price;
  const href = `/product/${product.slug}`;

  return (
    <article className="pcard">
      <Link to={href} className="pcard__media" tabIndex={-1} aria-hidden="true">
        <ProductImage src={product.image_url} kind={product.category_slug} alt="" />
        {soldOut ? <span className="pcard__badge pcard__badge--out">Sold out</span> : onSale && <span className="pcard__badge">Sale</span>}
      </Link>
      <div className="pcard__body">
        <span className="pcard__cat">{product.category_name}</span>
        <h3 className="pcard__name"><Link to={href}>{product.name}</Link></h3>
        <div className="pcard__foot">
          <Price price={product.price} compareAt={product.compare_at_price} />
          <button
            className="pcard__add"
            onClick={() => add(product)}
            disabled={soldOut}
            aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to bag`}
          >
            <Icon name="plus" size={20} />
          </button>
        </div>
      </div>
    </article>
  );
}
