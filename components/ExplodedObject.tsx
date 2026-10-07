import type { AnatomyLayer } from '@/types';
import { Plate } from './Plate';
import { TechnicalAnnotation } from './TechnicalAnnotation';

/*
 * The exploded stack. Each layer is placed by a single CSS variable, `--i`
 * (its position in the stack) and `--explode` (how far apart the stack is,
 * 0 assembled to 1 fully open). The section's scroll writes `--explode`
 * directly, so no React state changes while the visitor scrolls.
 *
 * To replace a layer with a 3D model, render the model in place of the Plate
 * inside the same `.anatomy__layer`; the placement stays the same.
 */
export function ExplodedObject({ layers }: { layers: AnatomyLayer[] }) {
  return (
    <div className="anatomy__stack">
      {layers.map((layer, i) => (
        <div
          key={layer.order}
          className="anatomy__layer"
          style={{ ['--i' as string]: i - (layers.length - 1) / 2, zIndex: layers.length - i }}
        >
          <Plate plate={layer.plate} className="anatomy__plate" />
          <div className="anatomy__annot">
            <TechnicalAnnotation index={layer.order} label={layer.name} detail={layer.dimension} side="right" />
          </div>
        </div>
      ))}
    </div>
  );
}
