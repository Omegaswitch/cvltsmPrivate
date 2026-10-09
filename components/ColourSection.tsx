import type { CSSProperties } from 'react';
import { TornEdge } from './TornEdge';
import { COLOURS } from '@/data/colours';

/**
 * The colourway as one strip of equal chips. It waits pinned beneath the
 * kits and is uncovered as their torn bottom edge scrolls away; the chips
 * rise one after another as it comes into view (globals.css).
 */
export function ColourSection() {
  return (
    <section id="colors" className="colours" aria-labelledby="colors-title">
      <h2 id="colors-title" className="title">Colors</h2>
      <ul className="strip">
        {COLOURS.map((c, i) => (
          <li key={c.name} style={{ '--i': i } as CSSProperties}>
            <span className="strip__chip" style={{ background: c.hex }} />
            <span className="strip__name">{c.name}</span>
            <span className="strip__hex">{c.hex}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
