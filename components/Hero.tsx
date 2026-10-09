import { Film } from './Film';
import { LogoSlot } from './LogoSlot';

/**
 * The opening: the film full bleed, the set's logo low on the left where the
 * eye settles, the manufacturer small and high on the right, and the reel's
 * count and control at the foot opposite the logo.
 */
export function Hero() {
  return (
    <section id="film" className="hero" aria-label="Film">
      <Film />
      <div className="hero__set"><LogoSlot of="set" /></div>
      <div className="hero__maker"><LogoSlot of="manufacturer" /></div>
    </section>
  );
}
