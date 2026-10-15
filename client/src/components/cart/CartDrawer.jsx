import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import CartLine from './CartLine.jsx';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import { formatNaira } from '../../utils/format.js';
import './CartDrawer.css';

export default function CartDrawer() {
  const { items, subtotal, count, drawerOpen, closeDrawer } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && closeDrawer();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  const checkout = () => { closeDrawer(); navigate('/checkout'); };

  return (
    <div className="drawer" role="dialog" aria-modal="true" aria-label="Your bag">
      <div className="drawer__scrim" onClick={closeDrawer} />
      <div className="drawer__panel">
        <div className="drawer__head">
          <h2>Your bag {count > 0 && <small>({count})</small>}</h2>
          <button onClick={closeDrawer} aria-label="Close bag"><Icon name="close" /></button>
        </div>

        {items.length === 0 ? (
          <div className="drawer__empty">
            <p>Your bag is empty.</p>
            <Button to="/shop" onClick={closeDrawer}>Start shopping</Button>
          </div>
        ) : (
          <>
            <ul className="drawer__lines">
              {items.map((i) => <CartLine key={i.id} item={i} onNavigate={closeDrawer} />)}
            </ul>
            <div className="drawer__foot">
              <div className="drawer__sub"><span>Subtotal</span><strong>{formatNaira(subtotal)}</strong></div>
              <p>Delivery is added at checkout.{!user && ' You will log in or create an account to place your order.'}</p>
              <Button variant="gold" size="lg" block onClick={checkout}>{user ? 'Checkout' : 'Log in to checkout'}</Button>
              <Button variant="quiet" block onClick={() => { closeDrawer(); navigate('/cart'); }}>View full bag</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
