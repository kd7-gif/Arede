// Store details used across the site. Edit this file to change contact info, hours, social links or the hero photo.

export const store = {
  name: 'Arede',
  wordmark: 'ARÉDÈ',
  tagline: 'Elegance all the way',
  values: 'Quality | Style | Comfort',

  // Put your real logo file in /client/public (for example logo.png) and set this to '/logo.png'.
  // Leave it empty to use the built-in crown mark.
  logoSrc: '',

  // A wide, tall photo for the home page hero (for example '/hero.jpg' placed in /client/public).
  // Leave empty to show the placeholder art.
  heroImage: '/hero.webp',

  address: {
    line1: 'Westmead Mall',
    line2: 'Park Manor Estate, Samonda',
    city: 'Ibadan',
  },
  hours: [
    { days: 'Monday to Saturday', time: '9:00am to 7:00pm' },
    { days: 'Sunday', time: '1:00pm to 6:00pm' },
  ],

  phoneDisplay: '0706 523 0243',
  phoneTel: '+2347065230243',
  whatsapp: '2347065230243', // international format, no plus sign
  instagram: 'arede_homes',
  tiktok: 'arede.homes',
  email: 'aredenig@gmail.com',
};

export const mapsUrl =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent('Westmead Mall, Park Manor Estate, Samonda, Ibadan');

export const whatsappLink = (text = '') =>
  `https://wa.me/${store.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
