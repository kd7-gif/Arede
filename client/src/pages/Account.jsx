import { useState } from 'react';
import Field from '../components/ui/Field.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import './Cart.css';

export default function Account() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    full_name: user.full_name,
    phone: user.phone || '',
    address: user.address || '',
    city: user.city || '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile(form);
      toast('Details saved');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: 96 }}>
      <header className="page-title"><h1>Account details</h1><p>{user.email}</p></header>
      <form className="checkout__block" onSubmit={save} style={{ maxWidth: 640, marginTop: 24 }}>
        <div className="checkout__row">
          <Field label="Full name" value={form.full_name} onChange={set('full_name')} />
          <Field label="Phone number" type="tel" value={form.phone} onChange={set('phone')} />
        </div>
        <Field label="Delivery address" value={form.address} onChange={set('address')} hint="Saved so checkout is quicker next time." />
        <Field label="City" value={form.city} onChange={set('city')} />
        <div><Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</Button></div>
      </form>
    </div>
  );
}
