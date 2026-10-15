import { useId, useState } from 'react';
import Icon from './Icon.jsx';
import './PasswordField.css';

// Password input shown as bullets. The eye button toggles between hidden and visible.
export default function PasswordField({ label, error, hint, className = '', ...rest }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div className={`field${error ? ' field--error' : ''} ${className}`.trim()}>
      <label htmlFor={id}>{label}</label>
      <div className="pw-wrap">
        <input
          id={id}
          className="input pw-input"
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          {...rest}
        />
        <button
          type="button"
          className="pw-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
        >
          <Icon name={visible ? 'eye-off' : 'eye'} size={20} />
        </button>
      </div>
      {error ? (
        <span id={`${id}-err`} className="field-error">{error}</span>
      ) : hint ? (
        <span id={`${id}-hint`} className="field-hint">{hint}</span>
      ) : null}
    </div>
  );
}
