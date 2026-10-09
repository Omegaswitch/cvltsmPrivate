import type { CSSProperties } from 'react';
import { COLOURS } from '@/data/colours';

/**
 * The colourway as one strip, each chip as wide as its share of the set.
 * It waits pinned beneath the kits and is uncovered as they scroll away;
 * the chips rise one after another as it comes into view (globals.css).
 */
export function ColourSection() {
  return (
    <section id="colour" className="colours" aria-labelledby="colour-title">
      <h2 id="colour-title" className="title">Colour</h2>
      <ul className="strip">
        {COLOURS.map((c, i) => (
          <li key={c.name} style={{ flexGrow: c.share, '--i': i } as CSSProperties}>
            <span className="strip__chip" style={{ background: c.hex }} />
            <span className="strip__name">{c.name}</span>
            <span className="strip__hex">{c.hex}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
