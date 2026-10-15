import { Link } from 'react-router-dom';
import './AnnouncementBar.css';

export default function AnnouncementBar() {
  return (
    <div className="announce">
      <div className="container announce__inner">
        <span>Now open at Westmead Mall, Samonda, Ibadan</span>
        <Link to="/shop">Browse the collection</Link>
      </div>
    </div>
  );
}
