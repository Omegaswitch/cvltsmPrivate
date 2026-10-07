import type { CSSProperties } from 'react';
import type { PlateSource } from '@/types';

/**
 * An image plate. With `src` it shows the photograph. Without it, it shows an
 * archival-style placeholder that names the aspect ratio and the file it is
 * waiting for, so replacing it is a matter of adding the file and setting `src`.
 */
export function Plate({
  plate,
  className = '',
  caption,
  eager = false,
}: {
  plate: PlateSource;
  className?: string;
  caption?: string;
  eager?: boolean;
}) {
  const style = { aspectRatio: plate.ratio } as CSSProperties;

  if (plate.src) {
    return (
      <figure className={`plate ${className}`} style={style}>
        <img
          src={plate.src}
          alt={plate.alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
        />
        {caption ? <figcaption className="plate__caption">{caption}</figcaption> : null}
      </figure>
    );
  }

  return (
    <figure className={`plate plate--empty ${className}`} style={style} role="img" aria-label={plate.alt}>
      <span className="plate__corner plate__corner--tl" aria-hidden="true" />
      <span className="plate__corner plate__corner--br" aria-hidden="true" />
      <figcaption className="plate__ph">
        <span>PLACEHOLDER</span>
        <span>{plate.ratio}</span>
        <span className="plate__path">{plate.path}</span>
      </figcaption>
    </figure>
  );
}
