import { RITUAL } from '@/data/ritual';
import { Plate } from './Plate';

/**
 * The ritual: a statement set large, then plates at deliberately different
 * scales, pushed to alternating edges. Plates without an image are left out,
 * so until the photographs exist the statement stands alone.
 */
export function RitualSection() {
  return (
    <section id="ritual" className="section ritual">
      <h2 className="ritual__title">{RITUAL.title}</h2>
      {RITUAL.plates.filter((p) => p.src).map((p) => (
        <div key={p.path} className={`ritual__item ritual__item--${p.scale} ritual__item--${p.align}`}>
          <Plate plate={p} />
        </div>
      ))}
    </section>
  );
}
