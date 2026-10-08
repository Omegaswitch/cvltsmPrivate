import { SET } from '@/data/site';

/** The opening: the wordmark on the paper, a line, and the way in. */
export function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero__text">
        {/* manufacturer slot: reserved height, so the wordmark does not move when the mark arrives */}
        <div className="hero__mfr">
          {SET.manufacturerLogo ? <img src={SET.manufacturerLogo} alt="Manufacturer" /> : null}
        </div>
        <h1 className="hero__word">{SET.name}</h1>
        <p className="hero__line">{SET.line}</p>
        <a className="hero__link" href="#kits">View the kits</a>
      </div>
    </section>
  );
}
