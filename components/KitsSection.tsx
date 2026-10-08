import { KITS } from '@/data/kits';
import { Plate } from './Plate';

/**
 * Kits: the base kit leads at seven columns, the numpad and novelties sit side
 * by side, and the deskmat runs the full width. Each kit is a plate and a line.
 */
export function KitsSection() {
  const [base, numpad, novelties, deskmat] = KITS;

  return (
    <section id="kits" className="section kits">
      <h2 className="section__title">Kits</h2>

      <div className="kits__lead">
        <Plate plate={base.plate} className="kits__lead-plate" />
        <div className="kits__lead-text">
          <h3 className="kit__name">{base.name}</h3>
          <p className="kit__summary">{base.summary}</p>
        </div>
      </div>

      <div className="kits__pair">
        {[numpad, novelties].map((k) => (
          <div key={k.id} className="kit">
            <Plate plate={k.plate} />
            <h3 className="kit__name">{k.name}</h3>
            <p className="kit__summary">{k.summary}</p>
          </div>
        ))}
      </div>

      <div className="kit kit--wide">
        <Plate plate={deskmat.plate} />
        <div className="kit__row">
          <h3 className="kit__name">{deskmat.name}</h3>
          <p className="kit__summary">{deskmat.summary}</p>
        </div>
      </div>
    </section>
  );
}
