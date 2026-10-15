import { Link } from 'react-router-dom';
import { store } from '../../config.js';
import './Logo.css';

export function Crown({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 56" fill="none" aria-hidden="true">
      <path d="M8 40 11 17l12 11 9-18 9 18 12-11 3 23z" fill="currentColor" />
      <rect x="8" y="43" width="48" height="5" rx="2" fill="currentColor" />
      <circle cx="11" cy="14" r="3" fill="currentColor" />
      <circle cx="32" cy="7" r="3.200" fill="currentColor" />
      <circle cx="53" cy="14" r="3" fill="currentColor" />
    </svg>
  );
}

// tone="dark" is for light backgrounds, tone="light" is for the green footer and admin bar.
export default function Logo({ tone = 'dark', showTagline = true }) {
  return (
    <Link to="/" className={`logo logo--${tone}`} aria-label={`${store.name} home`}>
      {store.logoSrc ? (
        <img className="logo__img" src={store.logoSrc} alt={store.name} />
      ) : (
        <>
          <Crown className="logo__crown" />
          <span className="logo__text">
            <span className="logo__word">{store.wordmark}</span>
            {showTagline && <span className="logo__tag">{store.tagline}</span>}
          </span>
        </>
      )}
    </Link>
  );
}
