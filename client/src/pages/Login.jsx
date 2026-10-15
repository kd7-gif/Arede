import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell.jsx';
import Field from '../components/ui/Field.jsx';
import PasswordField from '../components/ui/PasswordField.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Only allow redirects to pages on this site.
const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/');

export default function Login() {
  const { user, login } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get('next'));
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle={next === '/checkout' ? 'Log in to place your order. Your bag is saved.' : 'Log in to place orders and track them.'}
      footer={<>New to Arédè? <Link className="text-link" to={`/register${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`}>Create an account</Link></>}
    >
      <form onSubmit={submit} noValidate>
        {error && <p className="alert alert--error" role="alert">{error}</p>}
        <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <PasswordField label="Password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Button type="submit" size="lg" block disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</Button>
      </form>
    </AuthShell>
  );
}
