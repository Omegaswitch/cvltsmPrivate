import { BRAND } from '@/data/brand';
import { Film } from './Film';
import { Bleed } from './Bleed';

/**
 * The opening: the film full bleed, the set's logo low on the left where the
 * eye settles, the manufacturer's mark is in the menu (Nav). Until the set's
 * logo exists, its name stands in Valhalica, the face it was drawn with.
 * The logo bleeds, the way the colour chips do (Bleed).
 */
export function Hero() {
  return (
    <section id="film" className="hero" aria-label="Film">
      <Film />
      <div className="hero__set">
        {BRAND.logo
          ? <h1><Bleed src={BRAND.logo} alt={BRAND.name} /></h1>
          : <h1 className="wordmark">{BRAND.name}</h1>}
      </div>
    </section>
  );
}
