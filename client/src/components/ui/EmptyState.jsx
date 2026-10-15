import Button from './Button.jsx';
import './EmptyState.css';

export default function EmptyState({ title, text, actionLabel, actionTo, onAction }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {actionLabel && (actionTo ? <Button to={actionTo}>{actionLabel}</Button> : <Button onClick={onAction}>{actionLabel}</Button>)}
    </div>
  );
}
