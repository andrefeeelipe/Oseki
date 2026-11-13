/* Ícones de traço 24×24, traço 2px, pontas arredondadas, sem preenchimento (design system Oseki). */
const P: Record<string, string> = {
  home: 'M4 11l8-7 8 7v9H4z|M10 20v-5h4v5',
  cal: 'M4 5h16v15H4z|M4 10h16M9 3v4M15 3v4M9 15l2 2 4-4',
  belt: 'M2 9h20v6H2z|M10 15l-2 6M14 15l2 6',
  user: 'M12 4a4 4 0 1 0 0 8 4 4 0 1 0 0-8|M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7',
  clip: 'M5 4h14v17H5z|M9 4V2h6v2M9 13l2 2 4-4',
  inbox: 'M4 13l3-8h10l3 8v6H4z|M4 13h5l1 2h4l1-2h5',
  users: 'M9 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 1 0 0-7|M2.5 20c.8-3.8 3.4-6 6.5-6s5.7 2.2 6.5 6|M17 6.5a2.5 2.5 0 1 0 0 5|M16.5 14c2.6.2 4.4 2.2 5 5',
  bell: 'M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7|M10 20a2 2 0 0 0 4 0',
  pin: 'M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z|M12 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5',
  pinOff: 'M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z|M4 4l16 16',
  check: 'M5 12l5 5 9-10',
  checkCircle: 'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18|M8 12l3 3 5-6',
  back: 'M15 5l-7 7 7 7',
  chev: 'M9 5l7 7-7 7',
  logout: 'M15 4h4v16h-4|M10 8l-4 4 4 4M6 12h10',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4z|M12 9.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 1 0 0-7',
  qr: 'M4 4h6v6H4z|M14 4h6v6h-6z|M4 14h6v6H4z|M14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  play: 'M6 4l14 8-14 8z',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z|M4 19V5',
  card: 'M3 6h18v12H3z|M7 10h4M7 14h7',
  money: 'M3 6h18v12H3z|M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0z|M8 6H4c0 3 2 4 4 4M16 6h4c0 3-2 4-4 4M12 13v4M8 21h8M10 17h4',
  scale: 'M12 3v18M5 7h14|M5 7l-3 7h6zM19 7l-3 7h6z',
  doc: 'M14 3H6v18h12V7z|M14 3v4h4M9 13h6M9 17h4',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  megaphone: 'M3 10v4h4l7 4V6l-7 4z|M18 9a4 4 0 0 1 0 6',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6|M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1|M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  send: 'M4 12l16-8-6 16-3-7z',
  lock: 'M6 11h12v9H6z|M8 11V8a4 4 0 0 1 8 0v3',
  door: 'M6 3h10v18H6z|M13 12h.01M16 3l3 2v14l-3 2',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  video: 'M3 6h12v12H3z|M15 10l6-3v10l-6-3',
  share: 'M12 3v12|M8 7l4-4 4 4|M5 13v7h14v-7',
  copy: 'M8 8h12v12H8z|M4 16V4h12',
  monitor: 'M3 4h18v12H3z|M8 20h8M12 16v4',
  refresh: 'M20 11a8 8 0 1 0-2 6|M20 4v7h-7',
  edit: 'M4 20h4L19 9l-4-4L4 16z',
  flame: 'M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s1 2 2 2c0-4 2-8 2-8z',
};

export function Icon({ n, size = 22, sw = 2, className, style }: { n: keyof typeof P | string; size?: number; sw?: number; className?: string; style?: React.CSSProperties }) {
  const d = P[n] ?? P.chev;
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      {d.split('|').map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}
