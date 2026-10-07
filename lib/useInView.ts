'use client';

import { type RefObject, useEffect, useState } from 'react';

/**
 * True while the element is on screen (or within `margin` of it). Used to mount
 * the 3D scenes only when they are about to be seen, and to tear them down
 * when they leave, so an off-screen canvas costs nothing.
 */
export function useInView<T extends Element>(ref: RefObject<T | null>, margin = '200px'): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: `${margin} 0px`,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return inView;
}
