import { Crown } from '../ui/Logo.jsx';
import { store } from '../../config.js';
import './AuthShell.css';

// Two-panel layout shared by the login and register pages.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth__art" aria-hidden="true">
        <Crown className="auth__crown" />
        <p className="auth__quote">{store.tagline}</p>
        <p className="auth__values">{store.values}</p>
      </aside>
      <div className="auth__panel">
        <div className="auth__box">
          <h1>{title}</h1>
          {subtitle && <p className="auth__sub">{subtitle}</p>}
          {children}
          {footer && <p className="auth__foot">{footer}</p>}
        </div>
      </div>
    </div>
  );
}
