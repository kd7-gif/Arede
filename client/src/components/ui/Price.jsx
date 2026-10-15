import { formatNaira } from '../../utils/format.js';
import './Price.css';

export default function Price({ price, compareAt, size = 'md' }) {
  const onSale = compareAt && compareAt > price;
  return (
    <span className={`price price--${size}`}>
      <span className="price__now">{formatNaira(price)}</span>
      {onSale && (
        <>
          <s className="price__was" aria-label={`was ${formatNaira(compareAt)}`}>{formatNaira(compareAt)}</s>
        </>
      )}
    </span>
  );
}
