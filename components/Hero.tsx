import { BRAND } from '@/data/brand';
import { Film } from './Film';

/**
 * The opening: the film full bleed, the set's logo low on the left where the
 * eye settles, the manufacturer small and high on the left. Until the set's
 * logo exists, its name stands in Valhalica, the face it was drawn with.
 */
export function Hero() {
  return (
    <section id="film" className="hero" aria-label="Film">
      <Film />
      <div className="hero__set">
        {BRAND.logo
          ? <h1><img className="logo" src={BRAND.logo} alt={BRAND.name} /></h1>
          : <h1 className="wordmark">{BRAND.name}</h1>}
      </div>
      <img className="hero__maker logo" src={BRAND.manufacturer.logo} alt={BRAND.manufacturer.name} />
    </section>
  );
}
