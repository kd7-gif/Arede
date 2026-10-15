import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useApi } from '../../utils/useApi.js';
import { formatDate, formatNaira, STATUS } from '../../utils/format.js';

export default function AdminDashboard() {
  const { data, loading, error } = useApi(() => api('/admin/stats'), []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="alert alert--error">{error.message}</p>;
  const { counts: c, recent } = data;

  return (
    <>
      <div className="adm__head"><h1>Dashboard</h1></div>

      <div className="stats">
        <div className="stat"><span>Revenue (paid orders)</span><strong>{formatNaira(c.revenue)}</strong><small>{c.paid_orders} paid orders</small></div>
        <div className="stat"><span>To handle</span><strong>{c.to_handle}</strong><small>paid, waiting for you</small></div>
        <div className="stat"><span>Refunds due</span><strong>{c.refunds_due}</strong>{c.refunds_due > 0 && <small>refund in Paystack, then mark done</small>}</div>
        <div className="stat"><span>Products</span><strong>{c.products}</strong>{c.low_stock > 0 && <small>{c.low_stock} low on stock</small>}</div>
      </div>

      <div className="adm__head"><h2>Recent orders</h2><Link className="text-link" to="/admin/orders">See all orders</Link></div>
      <div className="tablewrap">
        <table className="table">
          <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th className="num">Total</th></tr></thead>
          <tbody>
            {recent.length === 0 && <tr><td colSpan="5">No orders yet.</td></tr>}
            {recent.map((o) => (
              <tr key={o.id}>
                <td><strong>{o.order_number}</strong></td>
                <td>{o.customer_name}</td>
                <td>{formatDate(o.created_at)}</td>
                <td><span className={`pill pill--${STATUS[o.status].tone}`}>{STATUS[o.status].label}</span></td>
                <td className="num">{formatNaira(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
