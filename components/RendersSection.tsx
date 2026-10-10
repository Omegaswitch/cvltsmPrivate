import { RENDERS } from '@/data/renders';
import { Engravings } from './Engravings';
import { Seep } from './Seep';
import { TornEdge } from './TornEdge';

/** The renders on an uneven grid, each drifting at its own depth like the kits. */
export function RendersSection() {
  return (
    <section id="renders" className="renders" aria-labelledby="renders-title">
      <TornEdge seed={29} />
      <Engravings section="renders" />
      <Seep />
      <h2 id="renders-title" className="title">Renders</h2>
      <div className="renders__grid">
        {RENDERS.map((r) => (
          <figure key={r.id} className={`render render--${r.span}`}>
            <div className="render__frame frame">
              {r.src ? (
                <img src={r.src} alt={r.alt} loading="lazy" decoding="async" style={{ aspectRatio: "1 / 1" }} />
              ) : (
                <div className="slot" style={{ aspectRatio: "1 / 1" }} role="img" aria-label={`${r.alt} (to come)`}>
                  <span className="slot__label" aria-hidden="true">{r.alt}</span>
                </div>
              )}
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}
