import { KITS } from '@/data/kits';
import { Engravings } from './Engravings';
import { TornEdge } from './TornEdge';
import { Trace } from './Trace';

/**
 * The kits come up over the film on a torn edge. Each render sits at its own
 * depth and drifts against the scroll at its own pace (globals.css).
 */
export function KitsSection() {
  return (
    <section id="kits" className="kits" aria-labelledby="kits-title">
      <TornEdge />
      <Engravings section="kits" />
      <h2 id="kits-title" className="title">Kits</h2>
      <div className="kits__grid">
        {KITS.map((k) => (
          <figure key={k.id} className={`kit kit--${k.id}`}>
            <div className="kit__frame frame">
              {k.src ? (
                <img src={k.src} alt={`${k.name} kit`} loading="lazy" decoding="async" style={{ aspectRatio: "1 / 1" }} />
              ) : (
                <div className="slot" style={{ aspectRatio: "1 / 1" }} role="img" aria-label={`${k.name} render (to come)`}>
                  <span className="slot__label" aria-hidden="true">{k.name} render</span>
                </div>
              )}
              {k.src && <button type="button" className="zoom" aria-label={`View larger: ${k.name} kit`} />}
              <Trace />
            </div>
            <figcaption className="kit__name">{k.name}</figcaption>
          </figure>
        ))}
      </div>
      {/* the kits' own bottom edge, torn, over the colors waiting beneath */}
      <TornEdge seed={13} side="bottom" />
    </section>
  );
}
