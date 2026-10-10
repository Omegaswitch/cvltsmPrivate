import { BRAND } from '@/data/brand';
import { Home } from './Home';
import { DaubLink } from './Daub';

const LINKS = [
  { href: '#kits', label: 'Kits' },
  { href: '#colors', label: 'Colors' },
  { href: '#renders', label: 'Renders' },
  { href: '#vendors', label: 'Vendors' },
];

/** The manufacturer's mark, always on the left; the set's name joins it once the film is passed. One link home. The sections of the page, and nothing more. Each link is painted over with blood on hover. */
export function Nav() {
  return (
    <nav className="nav" aria-label="Sections">
      <Home label={`${BRAND.name}, back to the top`}>
        <img className="logo" src={BRAND.manufacturer.logo} alt={BRAND.manufacturer.name} />
        <span className="nav__name wordmark" aria-hidden="true">{BRAND.name}</span>
      </Home>
      {LINKS.map((l) => (
        <DaubLink key={l.href} href={l.href} label={l.label}>{l.label}</DaubLink>
      ))}
    </nav>
  );
}
