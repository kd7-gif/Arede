import { formatNaira } from '../../utils/format.js';
import './OrderSummary.css';

// deliveryFee: a number, or null when it is not known yet
export default function OrderSummary({ subtotal, deliveryFee = null, lines, children }) {
  const total = subtotal + (deliveryFee || 0);
  return (
    <aside className="osum" aria-label="Order summary">
      <h3>Order summary</h3>
      {lines}
      <dl>
        <div><dt>Subtotal</dt><dd>{formatNaira(subtotal)}</dd></div>
        <div>
          <dt>Delivery</dt>
          <dd>{deliveryFee === null ? 'Set at checkout' : deliveryFee === 0 ? 'Free' : formatNaira(deliveryFee)}</dd>
        </div>
        <div className="osum__total"><dt>Total</dt><dd>{formatNaira(total)}</dd></div>
      </dl>
      {children}
    </aside>
  );
}
