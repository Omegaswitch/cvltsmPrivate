import { BRAND } from '@/data/brand';
import { SpeakField } from './Incantation';

/** The colophon: what this is, whose, and when. And a place to speak. */
export function Footer() {
  return (
    <footer className="foot">
      <dl className="foot__grid">
        <div><dt>Set</dt><dd>{BRAND.name}</dd></div>
        <div><dt>Keycaps</dt><dd>Double-shot ABS</dd></div>
        <div><dt>Manufacturer</dt><dd>{BRAND.manufacturer.name ?? 'To be announced'}</dd></div>
        <div><dt>Year</dt><dd>{BRAND.year}</dd></div>
      </dl>
      <SpeakField stage={0} />
    </footer>
  );
}
