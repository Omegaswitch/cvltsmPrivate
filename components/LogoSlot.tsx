import { BRAND } from '@/data/brand';

/**
 * A logo's place in the composition. With the artwork set in data/brand.ts
 * it shows the artwork; without it, a marked space of the same size, so the
 * layout can be judged before the logos exist. Nothing here draws a logo.
 */
export function LogoSlot({ of, className = '' }: { of: 'set' | 'manufacturer'; className?: string }) {
  const src = of === 'set' ? BRAND.logo : BRAND.manufacturer.logo;
  const label = of === 'set' ? `${BRAND.name} logo` : BRAND.manufacturer.name ? `${BRAND.manufacturer.name} logo` : 'Manufacturer';

  if (src) {
    return <img className={`slot slot--${of} slot--filled ${className}`} src={src} alt={label} />;
  }
  return (
    <div className={`slot slot--${of} ${className}`} role="img" aria-label={`${label} (to come)`}>
      <span className="slot__label" aria-hidden="true">{label}</span>
    </div>
  );
}
