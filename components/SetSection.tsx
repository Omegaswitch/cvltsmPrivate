import { KEYCAPS } from '@/data/keycaps';
import { SET_RECORD } from '@/data/metadata';
import { Plate } from './Plate';

/**
 * Chapter 07. Hard cut back to bone and perfect order. Every keycap is a
 * specimen on the grid: its number, the object, and optionally its rune. No
 * cards, no shadows, no containers. Hover enlarges one and shows its record.
 */
export function SetSection() {
  return (
    <section id="set" className="set sec--bone" data-chapter="set">
      <div className="set__head">
        <p className="meta">CHAPTER 07 — THE SET</p>
        <dl className="set__record">
          {SET_RECORD.map((row) => (
            <div key={row.key}>
              <dt className="meta">{row.key}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <ul className="set__grid">
        {KEYCAPS.map((k) => (
          <li key={k.specimen} className="set__cell">
            <p className="set__no">{k.specimen}</p>
            <div className="set__object">
              <Plate plate={k.plate} className="set__plate" />
            </div>
            <p className="set__rune" aria-label={k.rune.name}>
              <span aria-hidden="true">{k.rune.glyph}</span>
              <span className="meta">{k.rune.name}</span>
            </p>
            <dl className="set__detail">
              <div><dt>PROFILE</dt><dd>{k.profile}</dd></div>
              <div><dt>LEGEND</dt><dd>{k.legend}</dd></div>
              <div><dt>MATERIAL</dt><dd>{k.material}</dd></div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
