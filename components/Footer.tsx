import { BRAND } from '@/data/brand';
import { DaubLink } from './Daub';
import { tears } from './TornEdge';

/** The colophon: when it comes, and whose it is. */
export function Footer() {
  return (
    <footer id="colophon" className="foot torn-top" style={tears({ top: 71 })}>
      <p className="foot__soon">Coming in {BRAND.year}</p>
      <div className="foot__base">
        <span>{BRAND.credit}</span>
        {/* the way in to the hidden station, for whoever reads runes: SVARTSKOG */}
        <span className="foot__runes" aria-hidden="true">ᛊᚹᚨᚱᛏᛊᚲᛟᚷ</span>
        <DaubLink href="/privacy" label="Privacy policy">Privacy policy</DaubLink>
      </div>
    </footer>
  );
}
