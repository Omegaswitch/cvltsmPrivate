const LINKS = [
  { href: '#film', label: 'Film' },
  { href: '#kits', label: 'Kits' },
  { href: '#colour', label: 'Colour' },
];

/** The sections of the page, and nothing more. Each link is daubed on hover. */
export function Nav() {
  return (
    <nav className="nav" aria-label="Sections">
      {LINKS.map((l) => (
        <a key={l.href} className="daub" href={l.href} data-label={l.label}><span>{l.label}</span></a>
      ))}
    </nav>
  );
}
