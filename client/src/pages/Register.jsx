import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell.jsx';
import Field from '../components/ui/Field.jsx';
import PasswordField from '../components/ui/PasswordField.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/');

export default function Register() {
  const { user, register } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get('next'));
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate(next, { replace: true });
    } catch (err) {
      setErrors(err.fields || {});
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="You need an account to place an order. It takes a minute."
      footer={<>Already have an account? <Link className="text-link" to={`/login${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`}>Log in</Link></>}
    >
      <form onSubmit={submit} noValidate>
        {error && !Object.keys(errors).length && <p className="alert alert--error" role="alert">{error}</p>}
        <Field label="Full name" autoComplete="name" value={form.full_name} onChange={set('full_name')} error={errors.full_name} />
        <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <Field label="Phone number" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} error={errors.phone} hint="We use this to confirm your orders." />
        <PasswordField label="Password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} hint="At least 8 characters." />
        <Button type="submit" size="lg" block disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</Button>
      </form>
    </AuthShell>
  );
}
