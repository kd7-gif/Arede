import { Link } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState.jsx';
import { api } from '../api/client.js';
import { useApi } from '../utils/useApi.js';
import { formatDate, formatNaira, STATUS } from '../utils/format.js';
import './Orders.css';

export default function Orders() {
  const { data, loading, error } = useApi(() => api('/orders'), []);
  const orders = data?.items || [];

  return (
    <div className="container orders">
      <header className="page-title"><h1>Your orders</h1></header>

      {loading && <p>Loading your orders...</p>}
      {error && <p className="alert alert--error">{error.message}</p>}
      {!loading && !error && orders.length === 0 && (
        <EmptyState title="No orders yet" text="When you place an order it will show up here, with its status." actionLabel="Browse the collection" actionTo="/shop" />
      )}

      <div className="orders__list">
        {orders.map((o) => (
          <article key={o.id} className="ocard">
            <header className="ocard__head">
              <div>
                <h2><Link to={`/order/${o.order_number}`}>{o.order_number}</Link></h2>
                <span className="ocard__small">Placed {formatDate(o.created_at)}</span>
              </div>
              <span className={`pill pill--${STATUS[o.status].tone}`}>{STATUS[o.status].label}</span>
            </header>
            <ul className="ocard__items">
              {o.items.map((i) => (
                <li key={`${o.id}-${i.product_id}-${i.product_name}`}>
                  <span>{i.quantity} x {i.product_name}</span>
                  <span>{formatNaira(i.line_total)}</span>
                </li>
              ))}
            </ul>
            <footer className="ocard__foot">
              <strong>Total {formatNaira(o.total)}</strong>
              <Link to={`/order/${o.order_number}`} className="text-link">
                {o.status === 'awaiting_payment' ? 'Pay now' : 'View details'}
              </Link>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
