import { useNavigate } from 'react-router-dom';
import CartLine from '../components/cart/CartLine.jsx';
import OrderSummary from '../components/cart/OrderSummary.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './Cart.css';

export default function Cart() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container">
        <EmptyState title="Your bag is empty" text="Add something you like and it will wait for you here." actionLabel="Browse the collection" actionTo="/shop" />
      </div>
    );
  }

  return (
    <div className="container cartpage">
      <header className="page-title"><h1>Your bag</h1></header>
      <div className="cartpage__layout">
        <div>
          <ul>{items.map((i) => <CartLine key={i.id} item={i} />)}</ul>
          <div className="cartpage__links">
            <Button to="/shop" variant="quiet">Continue shopping</Button>
            <Button variant="quiet" onClick={clear}>Empty bag</Button>
          </div>
        </div>
        <OrderSummary subtotal={subtotal}>
          <Button variant="gold" size="lg" block onClick={() => navigate('/checkout')}>{user ? 'Checkout' : 'Log in to checkout'}</Button>
          {!user && <p className="cartpage__note">You can browse and fill your bag freely. An account is needed to place the order.</p>}
        </OrderSummary>
      </div>
    </div>
  );
}
