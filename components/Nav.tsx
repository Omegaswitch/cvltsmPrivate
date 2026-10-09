const LINKS = [
  { href: '#kits', label: 'Kits' },
  { href: '#colors', label: 'Colors' },
  { href: '#renders', label: 'Renders' },
  { href: '#vendors', label: 'Vendors' },
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
