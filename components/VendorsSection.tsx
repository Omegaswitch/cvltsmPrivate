import { VENDOR_REGIONS } from '@/data/vendors';

/** Where the set is supplied, by region. */
export function VendorsSection() {
  return (
    <section id="vendors" className="section vendors">
      <h2 className="section__title">Vendors</h2>
      <ul className="vendors__list">
        {VENDOR_REGIONS.map((r) => (
          <li key={r.region} className="vendors__row">
            <span className="vendors__region">{r.region}</span>
            <span className="vendors__status">
              {r.vendors.length ? r.vendors.join(', ') : 'To be confirmed'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
