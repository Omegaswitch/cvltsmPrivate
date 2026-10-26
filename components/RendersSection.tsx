import { RENDERS } from '@/data/renders';
import { Engravings } from './Engravings';
import { tears } from './TornEdge';
import { Trace } from './Trace';

/** The renders on an uneven grid, each drifting at its own depth like the kits. */
export function RendersSection() {
  return (
    <section id="renders" className="renders torn-top" style={tears({ top: 29 })} aria-labelledby="renders-title">
      <Engravings section="renders" />
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
              {r.src && <button type="button" className="zoom" aria-label={`View larger: ${r.alt}`} />}
              <Trace />
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}
