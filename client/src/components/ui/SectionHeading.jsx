import './SectionHeading.css';

// Left-aligned heading with a short gold rule, optional text and an action on the right.
export default function SectionHeading({ title, text, action }) {
  return (
    <div className="shead">
      <div>
        <h2>{title}</h2>
        <span className="shead__rule" aria-hidden="true" />
        {text && <p>{text}</p>}
      </div>
      {action}
    </div>
  );
}
