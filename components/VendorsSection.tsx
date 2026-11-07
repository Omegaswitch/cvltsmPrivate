import { VENDORS } from '@/data/vendors';
import { FillLink } from './FillLink';
import { Engravings } from './Engravings';
import { tears } from './TornEdge';

/** Where the set is sold, by region. Confirmed vendors link out and fill with blood on hover, like the menu. */
export function VendorsSection() {
  return (
    <section id="vendors" className="vendors torn-top" style={tears({ top: 53 })} aria-labelledby="vendors-title">
      <Engravings section="vendors" />
      <h2 id="vendors-title" className="title">Vendors</h2>
      <ul className="vendors__list">
        {VENDORS.map((r) => (
          <li key={r.region} className="vendors__row">
            <span className="vendors__region">{r.region}</span>
            <span className="vendors__names">
              {r.vendors.length
                ? r.vendors.map((v) => v.href
                  ? <FillLink key={v.name} href={v.href} label={v.name} target="_blank" rel="noopener noreferrer" />
                  : <span key={v.name}>{v.name}</span>)
                : <span className="vendors__tba">To be announced</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
