import { BRAND } from '@/data/brand';
import { TornEdge } from './TornEdge';

/** The colophon: what this is, whose, and when. */
export function Footer() {
  return (
    <footer id="colophon" className="foot">
      <TornEdge seed={71} />
      <dl className="foot__grid">
        <div><dt>Set</dt><dd>{BRAND.name}</dd></div>
        <div><dt>Keycaps</dt><dd>Double-shot ABS</dd></div>
        <div><dt>Manufacturer</dt><dd>{BRAND.manufacturer.name ?? 'To be announced'}</dd></div>
        <div><dt>Year</dt><dd>{BRAND.year}</dd></div>
      </dl>
      <div className="foot__base">
        <span>{BRAND.credit}</span>
        <a className="daub" href="/privacy" data-label="Privacy policy"><span>Privacy policy</span></a>
      </div>
    </footer>
  );
}
