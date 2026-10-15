import Button from '../ui/Button.jsx';
import { ART } from '../ui/ProductImage.jsx';
import { assetUrl } from '../../api/client.js';
import { store } from '../../config.js';
import './Hero.css';

// Stand-in artwork until a real photo is set in config.js (store.heroImage).
function HeroArt() {
  const stroke = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg className="hero__art-svg" viewBox="0 0 400 520" role="img" aria-label="Pot, mugs and cutlery illustration">
      <g {...stroke} strokeWidth="1.800" transform="translate(110 250) scale(3.6)">{ART.cookware}</g>
      <g {...stroke} strokeWidth="2" transform="translate(18 120) scale(2.2)">{ART['mugs-cups']}</g>
      <g {...stroke} strokeWidth="2" transform="translate(240 90) scale(2.3)">{ART.cutlery}</g>
    </svg>
  );
}

function Seal() {
  return (
    <svg className="hero__seal" viewBox="0 0 160 160" role="img" aria-label="Now open">
      <defs>
        <linearGradient id="sealGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3de98" />
          <stop offset="0.5" stopColor="#d4af4b" />
          <stop offset="1" stopColor="#a8832a" />
        </linearGradient>
        <path id="sealCircle" d="M80 80m-58 0a58 58 0 1 1 116 0a58 58 0 1 1-116 0" />
      </defs>
      <circle cx="80" cy="80" r="78" fill="url(#sealGold)" />
      <circle cx="80" cy="80" r="70" fill="none" stroke="#0a2419" strokeOpacity="0.45" strokeWidth="1" />
      <text fontFamily="Figtree Variable, Figtree, sans-serif" fontSize="11.500" fontWeight="600" fill="#0a2419" letterSpacing="1.600">
        <textPath href="#sealCircle" startOffset="0">Westmead Mall, Samonda, Ibadan  </textPath>
      </text>
      <text x="80" y="76" textAnchor="middle" fontFamily="Bodoni Moda, serif" fontStyle="italic" fontWeight="700" fontSize="30" fill="#0a2419">Now</text>
      <text x="80" y="106" textAnchor="middle" fontFamily="Bodoni Moda, serif" fontStyle="italic" fontWeight="700" fontSize="30" fill="#0a2419">open</text>
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero__grid">
        <div className="hero__copy">
          <h1>
            <span className="hero__line"><span>Elegance</span></span>
            <span className="hero__line"><span>all the way</span></span>
          </h1>
          <p className="hero__lead">
            Ceramic plates, non-stick pots, mugs, cutlery, kitchen appliances and more, chosen to make every meal at home feel like an occasion.
          </p>
          <div className="hero__cta">
            <Button to="/shop" variant="gold" size="lg">Shop the collection</Button>
            <Button to="/#visit" variant="light" size="lg">Visit the store</Button>
          </div>
        </div>

        <div className="hero__art">
          <div className="hero__frame" aria-hidden="true" />
          <div className="hero__arch">
            {store.heroImage ? <img src={assetUrl(store.heroImage)} alt="Arédè kitchenware" /> : <HeroArt />}
          </div>
          <Seal />
        </div>
      </div>
    </section>
  );
}
