import type { CSSProperties } from 'react';
import { COLOURS } from '@/data/colours';
import { Ooze } from './Ooze';

/**
 * The colors, still bleeding: at the head of the renders, each color comes
 * up through the torn edge, in the same column it has above, and runs on down
 * the page. The drips run as the section scrolls in (globals.css).
 */
export function Seep() {
  return (
    <div className="seep" aria-hidden="true">
      {COLOURS.map((c, i) => (
        <span key={c.name} className="seep__col" style={{ '--i': i } as CSSProperties}>
          <Ooze hex={c.hex} index={i} mode="seep" />
        </span>
      ))}
    </div>
  );
}
