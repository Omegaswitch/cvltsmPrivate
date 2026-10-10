import type { CSSProperties } from 'react';

/*
 * A colour that has bled out of its outline. The fill spills a little over
 * the edge, blobs swell out of the sides, and thin drips run down and hang
 * below, a bead near the end of each; a gooey filter (`ooze` in BloodDefs:
 * blur, then alpha contrast) fuses them into one wet body. All the pieces are
 * the same colour, so the filter only has to melt shapes.
 *
 * Nothing is typed in by hand: every chip is drawn from a seeded random, so
 * each bleeds its own way, and the same way on every visit, on the server and
 * in the browser alike. Most drips are short; one or two on each are long
 * enough to run past the foot of the section, where the page that slides over
 * it (the renders) hides them: the bleed goes on behind it.
 */

function random(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

export function Ooze({ hex, index }: { hex: string; index: number }) {
  const rand = random(index * 7919 + 17);
  const r = (a: number, b: number) => a + rand() * (b - a);

  // thin and uneven: mostly short, a few long, one or two very long
  const count = 5 + Math.floor(rand() * 4);
  const drips = Array.from({ length: count }, (_, n) => ({
    x: r(5, 94),
    w: r(4.5, 12),
    len: n < 2 ? r(420, 640) : rand() < 0.25 ? r(130, 240) : r(22, 90),
  }));
  const blobs = Array.from({ length: 2 + Math.floor(rand() * 3) }, () => ({
    side: rand() < 0.5 ? 'l' : 'r',
    y: r(12, 82),
    s: r(18, 46),
    h: r(0.8, 1.2),
  }));

  return (
    <span className="ooze" style={{ '--c': hex } as CSSProperties} aria-hidden="true">
      <i className="ooze__body" />
      {drips.map((d, n) => (
        <i
          key={n}
          className={`ooze__drip${n < 2 ? ' ooze__drip--long' : ''}`}
          style={{ left: `${d.x}%`, width: d.w, '--len': d.len.toFixed(0), '--n': n } as CSSProperties}
        />
      ))}
      {blobs.map((b, n) => (
        <i
          key={n}
          className="ooze__blob"
          style={{ [b.side === 'l' ? 'left' : 'right']: -b.s * 0.45, top: `${b.y}%`, width: b.s, height: b.s * b.h } as CSSProperties}
        />
      ))}
    </span>
  );
}
