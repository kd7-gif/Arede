import { useState } from 'react';
import { api } from '../../api/client.js';
import { useApi } from '../../utils/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDateTime, formatNaira, PAYMENT_STATUS, STATUS } from '../../utils/format.js';

export default function AdminOrders() {
  const toast = useToast();
  const [filter, setFilter] = useState('');
  const [version, setVersion] = useState(0);
  const { data, loading, error } = useApi(() => api(`/admin/orders${filter ? `?status=${filter}` : ''}`), [filter, version]);
  const orders = data?.items || [];

  const optionsFor = (o) => {
    if (o.status === 'cancelled') return ['cancelled'];
    if (o.payment_status === 'unpaid') return ['awaiting_payment', 'cancelled'];
    const keys = ['confirmed', o.delivery_method === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup', 'completed', 'cancelled'];
    return keys;
  };

  const markRefunded = async (o) => {
    try {
      await api(`/admin/orders/${o.id}/refunded`, { method: 'PATCH' });
      toast(`${o.order_number} marked refunded`);
      setVersion((v) => v + 1);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const changeStatus = async (o, status) => {
    if (status === 'cancelled' && !window.confirm(`Cancel ${o.order_number}? The items go back into stock and this cannot be undone.${o.payment_status === 'paid' ? ' The customer has paid, so you must also refund them from your Paystack dashboard.' : ''}`)) return;
    try {
      await api(`/admin/orders/${o.id}/status`, { method: 'PATCH', body: { status } });
      toast(`${o.order_number} marked ${STATUS[status].label.toLowerCase()}`);
      setVersion((v) => v + 1);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="adm__head">
        <h1>Orders</h1>
        <div className="adm__tools">
          <label className="sr-only" htmlFor="statusFilter">Filter by status</label>
          <select id="statusFilter" className="select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All statuses</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="alert alert--error">{error.message}</p>}
      {loading && <p>Loading...</p>}
      {!loading && orders.length === 0 && <p>No orders found.</p>}

      <div className="ocards">
        {orders.map((o) => (
          <article key={o.id} className="aorder">
            <header className="aorder__head">
              <div>
                <h2>{o.order_number}</h2>
                <p className="aorder__meta">{formatDateTime(o.created_at)}, {PAYMENT_STATUS[o.payment_status]}{o.paid_at ? ` ${formatDateTime(o.paid_at)}` : ''}{o.payment_reference ? `, ref ${o.payment_reference}` : ''}</p>
              </div>
              <span className={`pill pill--${STATUS[o.status].tone}`}>{STATUS[o.status].label}</span>
            </header>
            <div className="aorder__meta">
              <strong style={{ color: 'var(--ink)' }}>{o.customer_name}</strong>, <a href={`tel:${o.phone}`}>{o.phone}</a>, {o.customer_email}
              <br />
              {o.delivery_method === 'delivery' ? `Deliver to ${o.address}, ${o.city}` : 'Pickup in store'}
              {o.note && <><br />Note: {o.note}</>}
            </div>
            <ul className="aorder__items">
              {o.items.map((i) => (
                <li key={`${o.id}-${i.product_id}-${i.product_name}`}><span>{i.quantity} x {i.product_name}</span><span>{formatNaira(i.line_total)}</span></li>
              ))}
            </ul>
            <footer className="aorder__foot">
              <strong>Total {formatNaira(o.total)}</strong>
              <label>
                <span className="sr-only">Order status</span>
                <select className="select" style={{ width: 'auto' }} value={o.status} disabled={o.status === 'cancelled'} onChange={(e) => changeStatus(o, e.target.value)}>
                  {optionsFor(o).map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
                </select>
              </label>
              {o.payment_status === 'refund_due' && (
                <button type="button" className="btn btn--gold" onClick={() => markRefunded(o)}>Mark as refunded</button>
              )}
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}
