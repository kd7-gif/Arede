import { useId } from 'react';

// Label + control + error in one piece. `as` can be "input" (default), "textarea" or "select".
export default function Field({ label, error, hint, as = 'input', className = '', children, ...rest }) {
  const id = useId();
  const Control = as;
  const controlClass = as === 'input' ? 'input' : as;
  return (
    <div className={`field${error ? ' field--error' : ''} ${className}`.trim()}>
      <label htmlFor={id}>{label}</label>
      <Control
        id={id}
        className={controlClass}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...rest}
      >
        {children}
      </Control>
      {error ? (
        <span id={`${id}-err`} className="field-error">{error}</span>
      ) : hint ? (
        <span id={`${id}-hint`} className="field-hint">{hint}</span>
      ) : null}
    </div>
  );
}
