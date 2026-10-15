import { useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { api } from '../api/client.js';
import { useApi } from '../utils/useApi.js';
import { whatsappLink } from '../config.js';
import { orderMessage } from '../utils/whatsapp.js';
import { formatNaira, PAYMENT_STATUS, STATUS } from '../utils/format.js';
import './Orders.css';

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const { state } = useLocation();
  const { data, loading, error } = useApi(() => api(`/orders/${orderNumber}`), [orderNumber]);
  const { data: settings } = useApi(() => api('/settings'), []);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(state?.paymentError || '');

  if (loading) return <div className="container section"><p>Loading your order...</p></div>;
  if (error) {
    return <div className="container"><EmptyState title="Order not found" text={error.message} actionLabel="See your orders" actionTo="/orders" /></div>;
  }

  const o = data.order;
  const paid = o.payment_status === 'paid' || o.payment_status === 'refund_due' || o.payment_status === 'refunded';
  const cancelled = o.status === 'cancelled';
  const unpaid = o.status === 'awaiting_payment';

  const payNow = async () => {
    setPaying(true);
    setPayError('');
    try {
      const res = await api(`/orders/${o.order_number}/pay`, { method: 'POST' });
      if (res.paymentUrl) window.location.assign(res.paymentUrl);
      else window.location.reload();
    } catch (e) {
      setPayError(e.message);
      setPaying(false);
    }
  };

  let title = `Order ${o.order_number}`;
  let text = '';
  if (paid && !cancelled) {
    title = state?.justPaid ? 'Payment received, thank you' : `Order ${o.order_number}`;
    text = 'Last step: send your order details to us on WhatsApp so we can get it ready for you.';
  } else if (cancelled) {
    title = 'This order was cancelled';
    text = paid ? 'Your payment will be refunded.' : 'No payment was taken. You can place a new order any time.';
  } else if (unpaid) {
    title = 'Almost there, payment needed';
    text = `Your items are held for ${settings?.holdMinutes ?? 30} minutes. Pay to confirm the order.`;
  }

  return (
    <div className="container done">
      <div className="done__head">
        <span className="done__tick"><Icon name={cancelled || unpaid ? 'clock' : 'check'} size={30} strokeWidth={2.2} /></span>
        <h1>{title}</h1>
        <p>Order number <strong>{o.order_number}</strong>. {text}</p>
      </div>

      <div className="done__grid">
        <section className="ocard">
          <h2>Items</h2>
          <ul className="ocard__items">
            {o.items.map((i) => (
              <li key={`${i.product_id}-${i.product_name}`}>
                <span>{i.quantity} x {i.product_name}</span>
                <span>{formatNaira(i.line_total)}</span>
              </li>
            ))}
          </ul>
          <dl className="ocard__totals">
            <div><dt>Subtotal</dt><dd>{formatNaira(o.subtotal)}</dd></div>
            <div><dt>Delivery</dt><dd>{o.delivery_fee ? formatNaira(o.delivery_fee) : 'Free'}</dd></div>
            <div className="ocard__grand"><dt>Total</dt><dd>{formatNaira(o.total)}</dd></div>
          </dl>
        </section>

        <div className="done__side">
          <section className="ocard">
            <h2>Status</h2>
            <span className={`pill pill--${STATUS[o.status].tone}`}>{STATUS[o.status].label}</span>
            <p className="ocard__small">{PAYMENT_STATUS[o.payment_status]}</p>
            {o.delivery_method === 'delivery' ? (
              <p className="ocard__small">Delivering to {o.address}, {o.city}</p>
            ) : (
              <p className="ocard__small">Pickup at Westmead Mall, Samonda</p>
            )}
          </section>

          <div className="done__actions done__pay">
            {payError && <p className="alert alert--error" role="alert">{payError}</p>}
            {unpaid && (
              <Button variant="gold" size="lg" onClick={payNow} disabled={paying}>
                {paying ? 'Opening Paystack...' : `Pay ${formatNaira(o.total)} with Paystack`}
              </Button>
            )}
            {paid && !cancelled && (
              <Button href={whatsappLink(orderMessage(o))} target="_blank" rel="noreferrer" variant="primary">
                <Icon name="whatsapp" size={18} /> Send order on WhatsApp
              </Button>
            )}
            <Button to="/orders" variant="outline">View all orders</Button>
          </div>
          <Link to="/shop" className="text-link">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
