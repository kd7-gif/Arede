import Icon from '../ui/Icon.jsx';
import { whatsappLink } from '../../config.js';
import './WhatsAppButton.css';

export default function WhatsAppButton() {
  return (
    <a
      className="wa"
      href={whatsappLink('Hello Arede, I would like to ask about an item.')}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
    >
      <Icon name="whatsapp" size={26} />
    </a>
  );
}
