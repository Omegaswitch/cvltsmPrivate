'use client';

import { useEffect, useState } from 'react';

/** Tracks a media query. Starts false on the server, so markup never mismatches. */
export function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);
  return matches;
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)');

/** Narrow screens and touch-first devices get the still compositions. */
export const useCompact = () => useMedia('(max-width: 820px), (pointer: coarse)');
