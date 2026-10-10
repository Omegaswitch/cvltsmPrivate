import type { CSSProperties } from 'react';

/*
 * A colour that has bled out of its frame. The fill spills a little over the
 * frame's inner edge, drips run down over the bottom of it and hang below,
 * and blobs swell out of the sides; a gooey filter (the `ooze` filter in
 * BloodDefs: blur, then alpha contrast) fuses them into one body, so the
 * edges are soft and wet and every drip ends in a bead. All the pieces are
 * the same colour, so the filter only has to melt shapes, not blend hues.
 *
 * Each chip gets its own drips (x across the chip in %, width, length in
 * px), so no two bleed the same way.
 */
const DRIPS: { x: number; w: number; len: number }[][] = [
  [{ x: 14, w: 22, len: 70 }, { x: 52, w: 16, len: 38 }, { x: 80, w: 26, len: 96 }],
  [{ x: 22, w: 18, len: 54 }, { x: 60, w: 28, len: 104 }, { x: 86, w: 14, len: 34 }],
  [{ x: 10, w: 26, len: 88 }, { x: 44, w: 16, len: 46 }, { x: 72, w: 20, len: 66 }],
  [{ x: 30, w: 24, len: 92 }, { x: 64, w: 16, len: 40 }, { x: 88, w: 20, len: 72 }],
];
/** Blobs swelling out of the sides: side, y across (%), size in px. */
const BLOBS: { side: 'l' | 'r'; y: number; s: number }[][] = [
  [{ side: 'r', y: 30, s: 46 }, { side: 'l', y: 70, s: 34 }],
  [{ side: 'l', y: 24, s: 40 }, { side: 'r', y: 62, s: 50 }],
  [{ side: 'r', y: 18, s: 36 }, { side: 'l', y: 58, s: 48 }],
  [{ side: 'l', y: 40, s: 44 }, { side: 'r', y: 76, s: 38 }],
];

export function Ooze({ hex, index }: { hex: string; index: number }) {
  const k = index % DRIPS.length;
  return (
    <span className="ooze" style={{ '--c': hex, '--i': index } as CSSProperties} aria-hidden="true">
      <i className="ooze__body" />
      {DRIPS[k].map((d, n) => (
        <i
          key={n}
          className="ooze__drip"
          style={{ left: `${d.x}%`, width: d.w, '--len': d.len, '--n': n } as CSSProperties}
        />
      ))}
      {BLOBS[k].map((b, n) => (
        <i
          key={n}
          className="ooze__blob"
          style={{ [b.side === 'l' ? 'left' : 'right']: -b.s * 0.45, top: `${b.y}%`, width: b.s, height: b.s } as CSSProperties}
        />
      ))}
    </span>
  );
}
