import type { CSSProperties } from 'react';
import type { Plate as PlateData } from '@/types';

/**
 * An image slot. The box holds its aspect ratio before the image arrives, so
 * nothing shifts when it loads. With no `src` it is an empty tile that draws
 * nothing, so an unfilled slot reads as deliberate space.
 */
export function Plate({
  plate,
  className = '',
  as = 'figure',
}: {
  plate: PlateData;
  className?: string;
  /** a div where the plate sits inside a button, which may not contain a figure */
  as?: 'figure' | 'div';
}) {
  const Tag = as;
  const style = { aspectRatio: plate.ratio } as CSSProperties;

  if (!plate.src) {
    return <Tag className={`plate plate--empty ${className}`} style={style} role="img" aria-label={plate.alt} />;
  }

  return (
    <Tag className={`plate ${className}`} style={style}>
      <img src={plate.src} alt={plate.alt} loading="lazy" decoding="async" />
    </Tag>
  );
}
