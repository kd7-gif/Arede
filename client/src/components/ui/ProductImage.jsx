import { useState } from 'react';
import { assetUrl } from '../../api/client.js';
import './ProductImage.css';

// Simple gold line drawings, one per category. Shown until a real photo is added in the admin panel.
export const ART = {
  cookware: (
    <>
      <path d="M16 30c0-8 7-13 16-13s16 5 16 13" />
      <path d="M12 30h40v17a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6z" />
      <circle cx="32" cy="13" r="2.500" />
      <path d="M12 37H6M52 37h6" />
    </>
  ),
  dinnerware: (
    <>
      <ellipse cx="32" cy="34" rx="25" ry="9" />
      <ellipse cx="32" cy="34" rx="15" ry="4.500" />
      <path d="M12 22c4-6 12-8 20-8s16 2 20 8" />
    </>
  ),
  'mugs-cups': (
    <>
      <path d="M14 22h28v22a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8z" />
      <path d="M42 28h4a6 6 0 0 1 0 12h-4" />
      <path d="M22 8c-2 3 2 4 0 7M30 8c-2 3 2 4 0 7" />
    </>
  ),
  cutlery: (
    <>
      <path d="M20 8v14a5 5 0 0 0 10 0V8M25 8v14M25 27v29" />
      <ellipse cx="44" cy="19" rx="5.500" ry="10" />
      <path d="M44 29v27" />
    </>
  ),
  appliances: (
    <>
      <path d="M16 22h26l4 26a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" transform="translate(2 0)" />
      <path d="M46 28l9-7M20 22c0-9 22-9 22 0" transform="translate(2 0)" />
      <path d="M28 36h10" transform="translate(2 0)" />
    </>
  ),
  'gift-sets': (
    <>
      <path d="M12 28h40v24H12zM9 20h46v8H9zM32 20v32" />
      <path d="M32 20c-4-11-14-8-10 0M32 20c4-11 14-8 10 0" />
    </>
  ),
  default: (
    <>
      <path d="M10 44 13 22l11 10 8-17 8 17 11-10 3 22z" />
      <path d="M10 50h44" />
    </>
  ),
};

export default function ProductImage({ src, alt = '', kind, className = '' }) {
  const [fit, setFit] = useState(false);
  if (src) {
    // Wide or very tall photos are shown whole instead of being cropped to the square frame.
    const onLoad = (e) => {
      const r = e.target.naturalWidth / e.target.naturalHeight;
      setFit(r > 1.2 || r < 0.7);
    };
    return (
      <div className={`pimg${fit ? ' pimg--fit' : ''} ${className}`}>
        <img src={assetUrl(src)} alt={alt} loading="lazy" onLoad={onLoad} />
      </div>
    );
  }
  return (
    <div className={`pimg pimg--ph ${className}`} role="img" aria-label={alt || 'Photo coming soon'}>
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.300" strokeLinecap="round" strokeLinejoin="round">
        {ART[kind] || ART.default}
      </svg>
    </div>
  );
}
