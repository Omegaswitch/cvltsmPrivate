import { COLOURS } from '@/data/colours';

/**
 * The colourway, as one continuous strip. The widths follow how much of the
 * set each colour covers; the names sit under the chips and nothing else.
 */
export function ColourSection() {
  return (
    <section id="colour" className="section colour">
      <h2 className="section__title">Colour</h2>
      <ul className="strip" aria-label="Colourway">
        {COLOURS.map((c) => (
          <li key={c.name}>
            <span className="strip__chip" style={{ background: c.hex }} aria-hidden="true" />
            <span className="strip__name">{c.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
