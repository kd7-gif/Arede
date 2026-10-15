import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Field from '../components/ui/Field.jsx';
import Icon from '../components/ui/Icon.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import OrderSummary from '../components/cart/OrderSummary.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { useApi } from '../utils/useApi.js';
import { formatNaira } from '../utils/format.js';
import './Cart.css';

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useApi(() => api('/settings'), []);

  const [form, setForm] = useState({
    name: user.full_name || '',
    phone: user.phone || '',
    address: user.address || '',
    city: user.city || '',
    note: '',
    deliveryMethod: 'delivery',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (items.length === 0) {
    return (
      <div className="container">
        <EmptyState title="Your bag is empty" text="Add something to your bag before checking out." actionLabel="Browse the collection" actionTo="/shop" />
      </div>
    );
  }

  const deliveryFee = form.deliveryMethod === 'pickup' ? 0 : settings ? settings.deliveryFee : null;

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError('');
    setSubmitting(true);
    try {
      const { order, paymentUrl, paymentError } = await api('/orders', {
        method: 'POST',
        body: { ...form, items: items.map((i) => ({ productId: i.id, quantity: i.quantity })) },
      });
      clear();
      if (paymentUrl) {
        window.location.assign(paymentUrl); // Paystack's secure payment page
        return;
      }
      navigate(`/order/${order.order_number}`, { replace: true, state: { paymentError } });
    } catch (err) {
      setErrors(err.fields || {});
      setFormError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container cartpage">
      <header className="page-title"><h1>Checkout</h1></header>
      {formError && <p className="alert alert--error" role="alert" style={{ marginTop: 16 }}>{formError}</p>}

      <form className="cartpage__layout" onSubmit={submit} noValidate>
        <div className="checkout__form">
          <section className="checkout__block">
            <h2>How should we get it to you?</h2>
            <div className="choice" role="radiogroup" aria-label="Delivery method">
              <label className="choice__opt">
                <input type="radio" name="dm" checked={form.deliveryMethod === 'delivery'} onChange={() => setForm((f) => ({ ...f, deliveryMethod: 'delivery' }))} />
                <div><strong>Delivery</strong><span>Nationwide delivery to your address{settings ? `, ${formatNaira(settings.deliveryFee)} flat fee` : ''}.</span></div>
              </label>
              <label className="choice__opt">
                <input type="radio" name="dm" checked={form.deliveryMethod === 'pickup'} onChange={() => setForm((f) => ({ ...f, deliveryMethod: 'pickup' }))} />
                <div><strong>Pick up in store</strong><span>Pick up from Westmead Mall, Samonda, Ibadan. No delivery fee.</span></div>
              </label>
            </div>
          </section>

          <section className="checkout__block">
            <h2>Your details</h2>
            <div className="checkout__row">
              <Field label="Full name" value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
              <Field label="Phone number" type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" />
            </div>
            {form.deliveryMethod === 'delivery' && (
              <>
                <Field label="Delivery address" value={form.address} onChange={set('address')} error={errors.address} autoComplete="street-address" />
                <Field label="City" value={form.city} onChange={set('city')} error={errors.city} autoComplete="address-level2" />
              </>
            )}
            <Field as="textarea" label="Note for us (optional)" value={form.note} onChange={set('note')} placeholder="Landmarks, gift message, preferred delivery time" />
          </section>

          <section className="checkout__block">
            <h2>Payment</h2>
            <p className="checkout__pay">
              <Icon name="shield" size={20} />
              <span>
                You pay securely online with Paystack (card, bank transfer or USSD) before we prepare your order.
                We never see or store your card details.
              </span>
            </p>
          </section>
        </div>

        <OrderSummary
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          lines={
            <ul className="checkout__mini">
              {items.map((i) => (
                <li key={i.id}><span>{i.quantity} x {i.name}</span><span>{formatNaira(i.price * i.quantity)}</span></li>
              ))}
            </ul>
          }
        >
          <Button type="submit" variant="gold" size="lg" block disabled={submitting}>
            {submitting ? 'Taking you to Paystack...' : deliveryFee === null ? 'Pay with Paystack' : `Pay ${formatNaira(subtotal + deliveryFee)} with Paystack`}
          </Button>
          <p className="cartpage__note">
            Your order is held for {settings?.holdMinutes ?? 30} minutes while you pay. <Link to="/cart" className="text-link">Edit your bag</Link>
          </p>
        </OrderSummary>
      </form>
    </div>
  );
}
