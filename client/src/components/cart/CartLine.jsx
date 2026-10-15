import { Link } from 'react-router-dom';
import ProductImage from '../ui/ProductImage.jsx';
import QuantityStepper from '../ui/QuantityStepper.jsx';
import Icon from '../ui/Icon.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { formatNaira } from '../../utils/format.js';
import './CartLine.css';

export default function CartLine({ item, onNavigate }) {
  const { setQuantity, remove } = useCart();
  const href = `/product/${item.slug}`;
  return (
    <li className="cline">
      <Link to={href} className="cline__img" onClick={onNavigate} tabIndex={-1} aria-hidden="true">
        <ProductImage src={item.image_url} kind={item.category_slug} alt="" />
      </Link>
      <div className="cline__main">
        <Link to={href} className="cline__name" onClick={onNavigate}>{item.name}</Link>
        <span className="cline__unit">{formatNaira(item.price)} each</span>
        <div className="cline__controls">
          <QuantityStepper value={item.quantity} max={item.stock} onChange={(q) => setQuantity(item.id, q)} label={`Quantity for ${item.name}`} />
          <button className="cline__remove" onClick={() => remove(item.id)} aria-label={`Remove ${item.name}`}>
            <Icon name="trash" size={18} />
          </button>
        </div>
      </div>
      <strong className="cline__total">{formatNaira(item.price * item.quantity)}</strong>
    </li>
  );
}
