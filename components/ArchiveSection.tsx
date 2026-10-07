'use client';

import { useCallback, useEffect, useState } from 'react';
import { ARCHIVE } from '@/data/archive';
import { Plate } from './Plate';
import { ImageViewer } from './ImageViewer';

/**
 * Chapter 06. A contact sheet: the slots are numbered, unevenly proportioned,
 * and set on a plain grid. Hover shows the tiny record. Click opens one image
 * alone.
 */
export function ArchiveSection() {
  const [open, setOpen] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);

  // keep the page still while a plate is open full-screen
  useEffect(() => {
    if (open === null) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <section id="archive" className="archive sec--black" data-chapter="archive">
      <div className="archive__head">
        <p className="meta">CHAPTER 06 — ARCHIVE</p>
        <p className="meta">CONTACT SHEET · {String(ARCHIVE.length).padStart(2, '0')} FRAMES</p>
      </div>

      <ol className="archive__sheet">
        {ARCHIVE.map((img, i) => (
          <li key={img.id}>
            <button
              type="button"
              className="archive__slot"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => setOpen(i)}
              aria-label={`Open ${img.id}`}
            >
              <Plate plate={img.plate} className="archive__plate" />
              <span className="archive__id">{img.id}</span>
              <span className={`archive__meta${hover === i ? ' is-shown' : ''}`} aria-hidden="true">
                {img.site} · {img.time}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {open !== null ? <ImageViewer image={ARCHIVE[open]} onClose={close} /> : null}
    </section>
  );
}
