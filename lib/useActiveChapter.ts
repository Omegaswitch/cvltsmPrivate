'use client';

import { useEffect, useState } from 'react';

/**
 * The chapter currently most of the way up the screen. Watches each chapter's
 * element and keeps the one whose centre is nearest the middle of the viewport.
 */
export function useActiveChapter(ids: string[]): string {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    const visible = new Map<string, number>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        }
        let best = ids[0];
        let bestRatio = -1;
        for (const id of ids) {
          const r = visible.get(id) ?? 0;
          if (r > bestRatio) { best = id; bestRatio = r; }
        }
        if (bestRatio > 0) setActive(best);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return active;
}
