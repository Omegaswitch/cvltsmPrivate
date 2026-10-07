import { RITUAL } from '@/data/ritual';
import { Plate } from './Plate';

/**
 * The ritual: a statement set large, then plates at deliberately different
 * scales, pushed to alternating edges, with black between them.
 */
export function RitualSection() {
  return (
    <section id="ritual" className="section ritual">
      <h2 className="ritual__title">{RITUAL.title}</h2>
      {RITUAL.plates.map((p) => (
        <div key={p.path} className={`ritual__item ritual__item--${p.scale} ritual__item--${p.align}`}>
          <Plate plate={p} />
        </div>
      ))}
    </section>
  );
}
