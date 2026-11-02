import { BRAND } from '@/data/brand';
import { FillLink } from './FillLink';
import { tears } from './TornEdge';
import { STATION_OPEN } from '@/lib/station/open';

/** The colophon: when it comes, and whose it is. */
export function Footer() {
  return (
    <footer id="colophon" className="foot torn-top" style={tears({ top: 71 })}>
      <p className="foot__soon">Coming in {BRAND.year}</p>
      <div className="foot__base">
        <span className="foot__credit">{BRAND.credit}</span>
        {/* the way in to the hidden station, for whoever reads runes: SVARTSKOG */}
        {STATION_OPEN && <span className="foot__runes" aria-hidden="true">ᛊᚹᚨᚱᛏᛊᚲᛟᚷ</span>}
        <FillLink href="/privacy" label="Privacy policy" />
      </div>
    </footer>
  );
}
