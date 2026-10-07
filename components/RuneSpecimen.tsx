'use client';

import { useEffect, useRef } from 'react';
import { RUNES } from '@/data/runes';
import { KEYCAPS } from '@/data/keycaps';
import { Plate } from './Plate';

/**
 * The fullscreen specimen. Kept deliberately bare: the rune, its name and index,
 * the keycap, and the technical line. Escape or the close control leaves; focus
 * moves into the dialog on open and is returned to the rune on close.
 */
export function RuneSpecimen({ index, onClose }: { index: number; onClose: () => void }) {
  const rune = RUNES[index];
  const keycap = KEYCAPS[index];
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', key);
      document.body.style.overflow = '';
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="specimen" role="dialog" aria-modal="true" aria-label={`${rune.name} specimen`}>
      <button ref={closeRef} type="button" className="specimen__close" onClick={onClose}>CLOSE</button>

      <div className="specimen__stage">
        <span className="specimen__glyph" aria-hidden="true">{rune.glyph}</span>
        <p className="specimen__name">{rune.name}</p>
      </div>

      <dl className="specimen__meta">
        <div><dt>SPECIMEN</dt><dd>{keycap.specimen}</dd></div>
        <div><dt>INDEX</dt><dd>{String(rune.index).padStart(2, '0')}</dd></div>
        <div><dt>ROW</dt><dd>{keycap.row}</dd></div>
        <div><dt>POSITION</dt><dd>{keycap.position}</dd></div>
        <div><dt>PROFILE</dt><dd>{keycap.profile}</dd></div>
        <div><dt>LEGEND</dt><dd>{keycap.legend}</dd></div>
        <div><dt>MATERIAL</dt><dd>{keycap.material}</dd></div>
      </dl>

      <Plate plate={keycap.plate} className="specimen__plate" />
    </div>
  );
}
