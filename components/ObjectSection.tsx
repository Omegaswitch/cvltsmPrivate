import { OBJECT_RECORD } from '@/data/metadata';
import { OBJECT_MACRO } from '@/data/assets';
import { Plate } from './Plate';

/**
 * Chapter 02. A hard cut from black to dirty bone. Set like the opening spread
 * of an architecture monograph: a heading in the grid, one macro plate large on
 * the right, and the record in thin rules.
 */
export function ObjectSection() {
  return (
    <section id="object" className="object sec--bone" data-chapter="object">
      <p className="meta object__kicker">CHAPTER 02 — THE OBJECT</p>

      <h2 className="object__title">
        <span>AN INPUT DEVICE</span>
        <span>RECONSTRUCTED</span>
        <span>AS RITUAL OBJECT.</span>
      </h2>

      <Plate plate={OBJECT_MACRO} className="object__plate" />

      <dl className="object__record">
        {OBJECT_RECORD.map((row) => (
          <div key={row.key} className="object__row">
            <dt className="meta">{row.key}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="meta object__coords">59.9139° N · 10.7522° E · FIG. 2.1</p>
    </section>
  );
}
