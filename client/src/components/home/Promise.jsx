import Icon from '../ui/Icon.jsx';
import './Promise.css';

const ITEMS = [
  { icon: 'shield', title: 'Quality you can hold', text: 'Every piece is checked in store before it goes on the shelf.' },
  { icon: 'truck', title: 'Nationwide delivery', text: 'We deliver to your door anywhere in Nigeria, or you can pick up from Westmead Mall, Samonda, Ibadan.' },
  { icon: 'shield', title: 'Pay securely online', text: 'Pay with Paystack, then send your order to us on WhatsApp.' },
  { icon: 'gift', title: 'Gift ready', text: 'Sets that are boxed and ready for weddings, housewarmings and hosts.' },
];

export default function Promise() {
  return (
    <section className="promise">
      <ul className="container promise__row">
        {ITEMS.map((i) => (
          <li key={i.title}>
            <Icon name={i.icon} size={30} strokeWidth={1.4} />
            <div>
              <h3>{i.title}</h3>
              <p>{i.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
