import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { CSSProperties } from 'react';

/*
 * Old woodcuts laid over the backgrounds, as faint light outlines, tilted and
 * half off the edge of their section. Drop prepared images into
 * public/engravings/ (scripts/make-engravings.mjs makes them from the
 * originals) and each is given the next free place below; nothing else to
 * edit. Places are listed so that neighbours land in different sections.
 *
 * A place: the section it lies in, the side it comes in from, how far down
 * the section (%), its width (vw), its tilt (deg), how much of it is hidden
 * past the edge (% of its own width) and how deep it drifts (vh, parallax).
 */
type Place = { section: Section; side: 'l' | 'r'; top: number; w: number; rot: number; off: number; drift: number; flip?: boolean };
type Section = 'kits' | 'colors' | 'renders' | 'vendors';

const PLACES: Place[] = [
  { section: 'kits', side: 'r', top: 3, w: 36, rot: 14, off: 34, drift: 9 },
  { section: 'renders', side: 'l', top: 2, w: 34, rot: -17, off: 38, drift: 7 },
  { section: 'colors', side: 'l', top: 8, w: 32, rot: 9, off: 40, drift: 5, flip: true },
  { section: 'vendors', side: 'r', top: 4, w: 33, rot: -12, off: 36, drift: 6 },
  { section: 'kits', side: 'l', top: 46, w: 31, rot: -22, off: 42, drift: 11, flip: true },
  { section: 'renders', side: 'r', top: 36, w: 37, rot: 19, off: 33, drift: 8 },
  { section: 'colors', side: 'r', top: 52, w: 34, rot: -8, off: 38, drift: 6 },
  { section: 'vendors', side: 'l', top: 68, w: 30, rot: 24, off: 44, drift: 5, flip: true },
  { section: 'kits', side: 'r', top: 80, w: 33, rot: -15, off: 36, drift: 10 },
  { section: 'renders', side: 'l', top: 72, w: 35, rot: 12, off: 39, drift: 9, flip: true },
];

/** Shown whole, without the fade towards the page: their faces sit on the faded side. */
const WHOLE = new Set(['1-05.webp']);

const files = (() => {
  try {
    return readdirSync(join(process.cwd(), 'public', 'engravings')).filter((f) => /\.(webp|png|jpe?g)$/i.test(f)).sort();
  } catch {
    return [];
  }
})();

/** The engravings that lie in one section. */
export function Engravings({ section }: { section: Section }) {
  const mine = files
    .map((file, i) => ({ file, place: PLACES[i % PLACES.length], round: Math.floor(i / PLACES.length) }))
    .filter((e) => e.place.section === section);
  if (!mine.length) return null;
  return (
    <div className="engravings" aria-hidden="true">
      {mine.map(({ file, place: p, round }) => (
        <img
          key={file}
          className={`engraving engraving--${p.side}${WHOLE.has(file) ? ' engraving--whole' : ''}`}
          src={`/engravings/${file}`}
          alt=""
          loading="lazy"
          decoding="async"
          style={{
            // a second lap round the places is nudged, so it does not sit on the first
            top: `${Math.min(88, p.top + round * 9)}%`,
            '--w': p.w,
            '--rot': `${p.rot + round * 7}deg`,
            '--off': `${p.off}%`,
            '--drift': `${p.drift}vh`,
            '--flip': p.flip ? -1 : 1,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
