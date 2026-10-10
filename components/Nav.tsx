import { DaubLink } from './Daub';

const LINKS = [
  { href: '#kits', label: 'Kits' },
  { href: '#colors', label: 'Colors' },
  { href: '#renders', label: 'Renders' },
  { href: '#vendors', label: 'Vendors' },
];

/** The sections of the page, and nothing more. Each link is painted over with blood on hover. */
export function Nav() {
  return (
    <nav className="nav" aria-label="Sections">
      {LINKS.map((l) => (
        <DaubLink key={l.href} href={l.href} label={l.label}>{l.label}</DaubLink>
      ))}
    </nav>
  );
}
