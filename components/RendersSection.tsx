'use client';

import { useCallback, useEffect, useState } from 'react';
import { RENDERS } from '@/data/renders';
import type { RenderPlate } from '@/types';
import { Plate } from './Plate';

/**
 * Renders: an asymmetric grid of plates at different scales. Each plate opens
 * on its own in a plain viewer.
 */
export function RendersSection() {
  const [open, setOpen] = useState<RenderPlate | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const renders = RENDERS.filter((r) => r.src);
  // no renders yet: no section, rather than a wall of empty frames
  if (!renders.length) return null;

  return (
    <section id="renders" className="section renders">
      <h2 className="section__title">Renders</h2>
      <ul className="renders__grid">
        {renders.map((r) => (
          <li key={r.path} className={`renders__item renders__item--${r.span}`}>
            <button type="button" className="renders__button" onClick={() => setOpen(r)} aria-label={`Open: ${r.alt}`}>
              <Plate plate={r} as="div" />
            </button>
          </li>
        ))}
      </ul>
      {open ? <Viewer plate={open} onClose={close} /> : null}
    </section>
  );
}

function Viewer({ plate, onClose }: { plate: RenderPlate; onClose: () => void }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', key);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label={plate.alt}>
      <button type="button" className="viewer__close" onClick={onClose} autoFocus>Close</button>
      <div className="viewer__frame">
        <Plate plate={plate} />
      </div>
    </div>
  );
}
