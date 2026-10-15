import { Link } from 'react-router-dom';
import Logo from '../ui/Logo.jsx';
import Icon from '../ui/Icon.jsx';
import { store, mapsUrl, whatsappLink } from '../../config.js';
import { useCategories } from '../../utils/useCategories.js';
import './Footer.css';

export default function Footer() {
  const categories = useCategories();
  return (
    <footer className="ftr">
      <div className="container ftr__grid">
        <div className="ftr__brand">
          <Logo tone="light" />
          <p className="ftr__values">{store.values}</p>
          <div className="ftr__social">
            <a href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noreferrer" aria-label="Instagram">
              <Icon name="instagram" />
            </a>
            <a href={`https://www.tiktok.com/@${store.tiktok}`} target="_blank" rel="noreferrer" aria-label="TikTok">
              <Icon name="tiktok" />
            </a>
            <a href={whatsappLink()} target="_blank" rel="noreferrer" aria-label="WhatsApp">
              <Icon name="whatsapp" />
            </a>
          </div>
        </div>

        <div>
          <h4>Shop</h4>
          <ul>
            {categories.map((c) => (
              <li key={c.slug}><Link to={`/shop?category=${c.slug}`}>{c.name}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Your account</h4>
          <ul>
            <li><Link to="/login">Log in</Link></li>
            <li><Link to="/register">Create an account</Link></li>
            <li><Link to="/orders">Track your orders</Link></li>
            <li><Link to="/cart">Your bag</Link></li>
          </ul>
        </div>

        <div>
          <h4>Visit us</h4>
          <address>
            <a href={mapsUrl} target="_blank" rel="noreferrer">
              {store.address.line1}<br />{store.address.line2}<br />{store.address.city}
            </a>
          </address>
          <ul className="ftr__contact">
            <li><a href={`tel:${store.phoneTel}`}><Icon name="phone" />{store.phoneDisplay}</a></li>
            <li><a href={`mailto:${store.email}`}><Icon name="mail" />{store.email}</a></li>
            <li><a href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noreferrer"><Icon name="instagram" />@{store.instagram}</a></li>
            <li><a href={`https://www.tiktok.com/@${store.tiktok}`} target="_blank" rel="noreferrer"><Icon name="tiktok" />@{store.tiktok}</a></li>
          </ul>
        </div>
      </div>
      <div className="container ftr__base">
        <span>© {new Date().getFullYear()} {store.name}. All rights reserved.</span>
        <span>{store.tagline}</span>
      </div>
    </footer>
  );
}
