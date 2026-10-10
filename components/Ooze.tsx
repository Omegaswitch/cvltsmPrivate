import type { CSSProperties } from 'react';

/*
 * A colour that has bled out. The fill spills a little over its outline, blobs
 * swell out of the sides, and thin drips run down and hang below, a bead at
 * the end of each; a gooey filter (`ooze` in BloodDefs: blur, then alpha
 * contrast) fuses them into one wet body. All the pieces are the same colour,
 * so the filter only has to melt shapes.
 *
 * Nothing here is typed in by hand: every chip and every seep is drawn from a
 * seeded random, so each bleeds its own way, and the same way on every visit,
 * on the server and in the browser alike.
 *
 * `chip` is a colour bleeding out of its outline; `seep` is the same colour
 * coming up through the torn edge of the next section and running down it.
 */

function random(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

export function Ooze({ hex, index, mode = 'chip' }: { hex: string; index: number; mode?: 'chip' | 'seep' }) {
  const rand = random(index * 7919 + (mode === 'seep' ? 104729 : 17));
  const r = (a: number, b: number) => a + rand() * (b - a);
  const seep = mode === 'seep';

  // thin and uneven: a few short ones, a few long, none alike
  const count = seep ? 4 + Math.floor(rand() * 3) : 4 + Math.floor(rand() * 4);
  const drips = Array.from({ length: count }, () => ({
    x: r(5, 94),
    w: r(4.5, 12),
    len: rand() < 0.28 ? r(seep ? 170 : 110, seep ? 300 : 190) : r(22, seep ? 130 : 78),
  }));
  // along a seep's edge: uneven lumps, so the pool is a spill and not an oval
  const lumps = !seep ? [] : Array.from({ length: 5 + Math.floor(rand() * 3) }, () => ({
    x: r(2, 88),
    top: r(-9, 8),
    w: r(14, 46),
    h: r(10, 26),
  }));
  const blobs = seep ? [] : Array.from({ length: 2 + Math.floor(rand() * 3) }, () => ({
    side: rand() < 0.5 ? 'l' : 'r',
    y: r(12, 82),
    s: r(18, 46),
  }));

  return (
    <span className={`ooze ooze--${mode}`} style={{ '--c': hex } as CSSProperties} aria-hidden="true">
      <i className="ooze__body" />
      {drips.map((d, n) => (
        <i
          key={n}
          className="ooze__drip"
          style={{ left: `${d.x}%`, width: d.w, '--len': d.len.toFixed(0), '--n': n } as CSSProperties}
        />
      ))}
      {lumps.map((l, n) => (
        <i key={`l${n}`} className="ooze__lump" style={{ left: `${l.x}%`, top: l.top, width: l.w, height: l.h } as CSSProperties} />
      ))}
      {blobs.map((b, n) => (
        <i
          key={n}
          className="ooze__blob"
          style={{ [b.side === 'l' ? 'left' : 'right']: -b.s * 0.45, top: `${b.y}%`, width: b.s, height: b.s * r(0.8, 1.2) } as CSSProperties}
        />
      ))}
    </span>
  );
}
