import { KITS } from '@/data/kits';
import { Engravings } from './Engravings';
import { DaubLink } from './Daub';
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
      <header className="kits__head">
        <h2 id="kits-title" className="title">Kits</h2>
        {/* from one kit to the next */}
        <nav className="kits__nav" aria-label="Kits">
          {KITS.map((k) => (
            <DaubLink key={k.id} href={`#kit-${k.id}`} label={k.name}>{k.name}</DaubLink>
          ))}
        </nav>
      </header>
      <div className="kits__grid">
        {KITS.map((k) => (
          <figure key={k.id} id={`kit-${k.id}`} className={`kit kit--${k.id}`}>
            <div className="kit__frame frame">
              {k.src ? (
                <img src={k.src} alt={`${k.name} kit`} loading="lazy" decoding="async" style={{ aspectRatio: "1 / 1" }} />
              ) : (
                <div className="slot" style={{ aspectRatio: "1 / 1" }} role="img" aria-label={`${k.name} render (to come)`}>
                  <span className="slot__label" aria-hidden="true">{k.name} render</span>
                </div>
              )}
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
