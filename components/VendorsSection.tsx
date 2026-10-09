import { VENDORS } from '@/data/vendors';
import { TornEdge } from './TornEdge';

/** Where the set is sold, by region. Confirmed vendors link out and are daubed on hover. */
export function VendorsSection() {
  return (
    <section id="vendors" className="vendors" aria-labelledby="vendors-title">
      <TornEdge seed={53} />
      <h2 id="vendors-title" className="title">Vendors</h2>
      <ul className="vendors__list">
        {VENDORS.map((r) => (
          <li key={r.region} className="vendors__row">
            <span className="vendors__region">{r.region}</span>
            <span className="vendors__names">
              {r.vendors.length
                ? r.vendors.map((v) => v.href
                  ? <a key={v.name} className="daub" href={v.href} data-label={v.name} target="_blank" rel="noopener noreferrer"><span>{v.name}</span></a>
                  : <span key={v.name}>{v.name}</span>)
                : <span className="vendors__tba">To be announced</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
