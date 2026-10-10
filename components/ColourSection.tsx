import type { CSSProperties } from 'react';
import { DripWatch } from './DripWatch';
import { Engravings } from './Engravings';
import { Ooze } from './Ooze';
import { COLOURS } from '@/data/colours';

/**
 * The colourway as one strip of equal chips, each in a twig frame it bleeds
 * out of. It waits pinned beneath the kits and is uncovered as their torn
 * bottom edge scrolls away; the chips rise one after another, and their
 * drips run as they come into view (globals.css).
 */
export function ColourSection() {
  return (
    <section id="colors" className="colours" aria-labelledby="colors-title">
      <Engravings section="colors" />
      <DripWatch />
      <h2 id="colors-title" className="title">Colors</h2>
      <ul className="strip">
        {COLOURS.map((c, i) => (
          <li key={c.name} style={{ '--i': i } as CSSProperties}>
            <span className="strip__chip frame"><Ooze hex={c.hex} index={i} /></span>
            <span className="strip__name">{c.name}</span>
            <span className="strip__hex">{c.hex}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
