const PATHS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  bag: <><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c1-4 4-6 8-6s7 2 8 6" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  check: <path d="m5 12 5 5 9-10" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>,
  shield: <><path d="M12 3 5 6v6c0 4.500 3 7.500 7 9 4-1.500 7-4.500 7-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  gift: <><path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13" /><path d="M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0" /></>,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  pin: <><path d="M12 21s7-6.200 7-11a7 7 0 1 0-14 0c0 4.800 7 11 7 11z" /><circle cx="12" cy="10" r="2.500" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  package: <><path d="m12 3 8 4.500v9L12 21l-8-4.500v-9z" /><path d="m4 7.500 8 4.500 8-4.500M12 12v9" /></>,
  whatsapp: <><path d="M3.500 20.500 5 16a8.500 8.500 0 1 1 3.200 3.100z" /><path d="M9 8.500c0 3.500 3 6.500 6.500 6.500l1-1.500-2-1-1 .8c-1-.4-2-1.300-2.300-2.300l.8-1-1-2z" /></>,
  instagram: <><rect x="3.500" y="3.500" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r=".8" fill="currentColor" /></>,
  tiktok: <path d="M14 4v10.500a3.500 3.500 0 1 1-3.500-3.500M14 4c.4 2.600 2 4 4.500 4.200" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2.500" /><path d="m3.500 7 8.500 6 8.500-6" /></>,
  phone: <path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  eye: <><path d="M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  'eye-off': <><path d="M3 3l18 18" /><path d="M10.600 6.100A9.800 9.800 0 0 1 12 5c6.500 0 10 7 10 7a17 17 0 0 1-3.200 4M6.600 6.700C3.700 8.500 2 12 2 12s3.500 7 10 7c1.700 0 3.200-.5 4.500-1.200" /><path d="M9.900 9.900a3 3 0 0 0 4.200 4.200" /></>,
  logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
};

export default function Icon({ name, size = 22, className = '', strokeWidth = 1.7 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
