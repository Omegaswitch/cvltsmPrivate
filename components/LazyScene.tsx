'use client';

import dynamic from 'next/dynamic';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useCompact, useReducedMotion } from '@/lib/useMedia';
import { useInView } from '@/lib/useInView';
import { hasWebGL } from '@/lib/webgl';

/*
 * The 3D scene is code-split and mounts only while it is near the screen.
 * Compact screens, reduced motion and browsers without WebGL get the poster.
 */
const KeyboardScene = dynamic(() => import('./KeyboardScene'), { ssr: false, loading: () => null });

export function LazyScene({ poster, className = '' }: { poster: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '320px');
  const reduced = useReducedMotion();
  const compact = useCompact();
  const [webgl, setWebgl] = useState(false);
  useEffect(() => setWebgl(hasWebGL()), []);

  const live = webgl && !reduced && !compact;

  return (
    <div ref={ref} className={`scene ${className}`}>
      {live && inView ? <KeyboardScene /> : poster}
    </div>
  );
}
