import { RENDERS } from '@/data/renders';
import { TornEdge } from './TornEdge';

/** The renders on an uneven grid, each drifting at its own depth like the kits. */
export function RendersSection() {
  return (
    <section id="renders" className="renders" aria-labelledby="renders-title">
      <TornEdge seed={29} />
      <h2 id="renders-title" className="title">Renders</h2>
      <div className="renders__grid">
        {RENDERS.map((r) => (
          <figure key={r.id} className={`render render--${r.span}`}>
            <div className="render__frame">
              {r.src ? (
                <img src={r.src} alt={r.alt} loading="lazy" decoding="async" style={{ aspectRatio: r.ratio }} />
              ) : (
                <div className="slot" style={{ aspectRatio: r.ratio }} role="img" aria-label={`${r.alt} (to come)`}>
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
