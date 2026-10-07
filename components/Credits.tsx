import { CREDITS } from '@/data/credits';
import { RUNES } from '@/data/runes';

/**
 * End credits, then one rune held alone in the centre of the screen. The
 * credits are placeholders until the names are confirmed.
 */
export function Credits() {
  return (
    <>
      <section className="credits sec--black" aria-label="Credits">
        <dl className="credits__list">
          {CREDITS.map((c) => (
            <div key={c.role}>
              <dt className="meta">{c.role}</dt>
              <dd>{c.name}</dd>
            </div>
          ))}
        </dl>
        <p className="meta credits__year">MMXXVI</p>
      </section>

      <section className="credits__final sec--black" aria-label="Final rune">
        <span className="credits__glyph" aria-hidden="true">{RUNES[0].glyph}</span>
      </section>
    </>
  );
}
