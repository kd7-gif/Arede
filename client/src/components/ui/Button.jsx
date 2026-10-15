import { Link } from 'react-router-dom';
import './Button.css';

// variant: primary (green) | gold | outline | light (for dark backgrounds) | quiet
export default function Button({ variant = 'primary', size = 'md', block = false, to, href, className = '', children, ...rest }) {
  const cls = `btn btn--${variant} btn--${size}${block ? ' btn--block' : ''} ${className}`.trim();
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{children}</a>;
  return <button type="button" className={cls} {...rest}>{children}</button>;
}
