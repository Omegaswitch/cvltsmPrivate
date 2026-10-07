'use client';

import dynamic from 'next/dynamic';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { KeyboardMode } from './KeyboardModel';
import { useCompact, useReducedMotion } from '@/lib/useMedia';
import { useInView } from '@/lib/useInView';
import { hasWebGL } from '@/lib/webgl';

/*
 * The 3D scene is code-split and only mounted while it is near the screen.
 * Compact screens and reduced-motion visitors get the still poster instead:
 * the same composition, without a live canvas.
 */
const KeyboardScene = dynamic(() => import('./KeyboardScene'), {
  ssr: false,
  loading: () => null,
});

export function LazyScene({
  mode,
  poster,
  className = '',
}: {
  mode: KeyboardMode;
  poster: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '320px');
  const reduced = useReducedMotion();
  const compact = useCompact();
  // checked on the client only; until then the poster is what shows
  const [webgl, setWebgl] = useState(false);
  useEffect(() => setWebgl(hasWebGL()), []);
  const live = webgl && !reduced && !compact;

  return (
    <div ref={ref} className={`scene ${className}`}>
      {live && inView ? <KeyboardScene mode={mode} /> : poster}
    </div>
  );
}
