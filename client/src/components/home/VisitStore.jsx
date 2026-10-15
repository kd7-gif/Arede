import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import { store, mapsUrl, whatsappLink } from '../../config.js';
import './VisitStore.css';

export default function VisitStore() {
  return (
    <section id="visit" className="section">
      <div className="container">
        <div className="visit">
          <div className="visit__main">
            <h2>Step into Aredé, where elegance awaits</h2>
            <p className="visit__lead">Feel the finish, admire the detail and find the piece your home has been missing.</p>
            <p className="visit__addr">
              {store.address.line1},<br />
              {store.address.line2},<br />
              {store.address.city}
            </p>
            <div className="visit__cta">
              <Button href={mapsUrl} target="_blank" rel="noreferrer" variant="primary"><Icon name="pin" size={18} /> Get directions</Button>
              <Button href={whatsappLink('Hello Arede, I am coming to the store.')} target="_blank" rel="noreferrer" variant="outline">
                <Icon name="whatsapp" size={18} /> Message us
              </Button>
            </div>
          </div>
          <div className="visit__side">
            <h3><Icon name="clock" size={22} /> Opening hours</h3>
            <dl>
              {store.hours.map((h) => (
                <div key={h.days}><dt>{h.days}</dt><dd>{h.time}</dd></div>
              ))}
            </dl>
            <p className="visit__phone">
              <Icon name="phone" size={20} /> <a href={`tel:${store.phoneTel}`}>{store.phoneDisplay}</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
