import { BRAND } from '@/data/brand';

/**
 * A logo's place in the composition. With the artwork set in data/brand.ts
 * it shows the artwork. Until then the set is its name in Valhalica, and the
 * manufacturer a marked space of the right size.
 */
export function LogoSlot({ of, className = '' }: { of: 'set' | 'manufacturer'; className?: string }) {
  const src = of === 'set' ? BRAND.logo : BRAND.manufacturer.logo;
  const label = of === 'set' ? `${BRAND.name} logo` : BRAND.manufacturer.name ? `${BRAND.manufacturer.name} logo` : 'Manufacturer';

  if (src) {
    return <img className={`slot slot--${of} slot--filled ${className}`} src={src} alt={label} />;
  }
  // for now the set's logo is its name in Valhalica, the face it was drawn with
  if (of === 'set') {
    return <h1 className={`wordmark ${className}`}>{BRAND.name}</h1>;
  }
  return (
    <div className={`slot slot--${of} ${className}`} role="img" aria-label={`${label} (to come)`}>
      <span className="slot__label" aria-hidden="true">{label}</span>
    </div>
  );
}
