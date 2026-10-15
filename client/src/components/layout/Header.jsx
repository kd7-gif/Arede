import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../ui/Logo.jsx';
import Icon from '../ui/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useCategories } from '../../utils/useCategories.js';
import './Header.css';


function AccountMenu() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, []);

  if (!user) {
    return (
      <Link to="/login" className="hdr__icon-btn hdr__login" aria-label="Log in or create an account">
        <Icon name="user" />
        <span>Log in</span>
      </Link>
    );
  }

  const go = (to) => { setOpen(false); navigate(to); };

  return (
    <div className="acct" ref={ref}>
      <button className="hdr__icon-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
        <Icon name="user" />
        <span className="acct__name">{user.full_name.split(' ')[0]}</span>
        <Icon name="chevron-down" size={14} />
      </button>
      {open && (
        <div className="acct__menu" role="menu">
          <button role="menuitem" onClick={() => go('/orders')}>My orders</button>
          <button role="menuitem" onClick={() => go('/account')}>Account details</button>
          {isAdmin && <button role="menuitem" onClick={() => go('/admin')}>Admin panel</button>}
          <button role="menuitem" onClick={() => { setOpen(false); logout(); navigate('/'); }}>Log out</button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { count, openDrawer } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const categories = useCategories();
  const catLinks = categories.map((c) => ({ to: `/shop?category=${c.slug}`, label: c.name }));
  const NAV = [{ to: '/shop', label: 'Shop all', end: true }, ...catLinks.slice(0, 4)];
  const MOBILE_NAV = [{ to: '/shop', label: 'Shop all' }, ...catLinks];

  useEffect(() => setMobileOpen(false), [location.pathname, location.search]);

  const search = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop');
    setMobileOpen(false);
  };

  return (
    <header className="hdr">
      <div className="container hdr__row">
        <button className="hdr__icon-btn hdr__burger" onClick={() => setMobileOpen((o) => !o)} aria-expanded={mobileOpen} aria-label="Menu">
          <Icon name={mobileOpen ? 'close' : 'menu'} />
        </button>

        <Logo />

        <nav className="hdr__nav" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={() => `hdr__link${location.pathname + location.search === n.to ? ' is-active' : ''}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="hdr__tools">
          <form className="hdr__search" onSubmit={search} role="search">
            <Icon name="search" size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the store" aria-label="Search products" />
          </form>
          <AccountMenu />
          <button className="hdr__icon-btn hdr__bag" onClick={openDrawer} aria-label={`Open bag, ${count} items`}>
            <Icon name="bag" />
            {count > 0 && <span className="hdr__count">{count}</span>}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="hdr__mobile">
          <form className="hdr__search hdr__search--mobile" onSubmit={search} role="search">
            <Icon name="search" size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the store" aria-label="Search products" />
          </form>
          {MOBILE_NAV.map((n) => <Link key={n.to} to={n.to}>{n.label}</Link>)}
          <Link to="/#visit">Visit the store</Link>
        </div>
      )}
    </header>
  );
}
