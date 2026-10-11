import { BRAND } from '@/data/brand';
import { DaubLink } from './Daub';
import { TornEdge } from './TornEdge';

/** The colophon: when it comes, and whose it is. */
export function Footer() {
  return (
    <footer id="colophon" className="foot">
      <TornEdge seed={71} />
      <p className="foot__soon">Coming in {BRAND.year}</p>
      <div className="foot__base">
        <span>{BRAND.credit}</span>
        <DaubLink href="/privacy" label="Privacy policy">Privacy policy</DaubLink>
      </div>
    </footer>
  );
}
