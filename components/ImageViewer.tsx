'use client';

import { useEffect, useRef } from 'react';
import type { ArchiveImage } from '@/types';
import { Plate } from './Plate';

/**
 * The fullscreen archive viewer, reduced to what it has to be: black, the
 * image, its index, and a close control. Escape also closes it.
 */
export function ImageViewer({ image, onClose }: { image: ArchiveImage; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label={image.id}>
      <button ref={closeRef} type="button" className="viewer__close" onClick={onClose}>CLOSE</button>
      <Plate plate={image.plate} className="viewer__plate" />
      <p className="viewer__index">{image.id}</p>
    </div>
  );
}
