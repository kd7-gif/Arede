import { useState } from 'react';

// Shown only on the demo build. Tells visitors this is sample data and how to try the admin side.
export default function DemoBanner() {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  const reset = async () => {
    const { resetDemo } = await import('../../api/demoApi.js');
    resetDemo();
    try { localStorage.removeItem('arede_signed_in'); localStorage.removeItem('arede_cart'); } catch { /* storage blocked */ }
    window.location.assign('/');
  };

  return (
    <div role="note" style={{ background: 'var(--green-900)', color: '#fff', fontSize: '0.85rem', padding: '0.55rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem 1.25rem', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <span><strong>Demo store.</strong> Sample data only: payments are simulated and nothing leaves your browser.</span>
      <span>Admin: <code>admin@arede.demo</code> / <code>demo1234</code> &middot; Customer: <code>customer@arede.demo</code> / <code>demo1234</code></span>
      <span>
        <button type="button" onClick={reset} style={{ color: '#fff', textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer', font: 'inherit' }}>Reset demo</button>
        {' '}
        <button type="button" onClick={() => setOpen(false)} aria-label="Hide demo notice" style={{ color: '#fff', background: 'none', border: 0, cursor: 'pointer', font: 'inherit', marginLeft: '0.5rem' }}>&times;</button>
      </span>
    </div>
  );
}
