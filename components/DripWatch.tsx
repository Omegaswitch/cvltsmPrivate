'use client';

import { useEffect, useRef } from 'react';

/*
 * Starts the dripping, once. The colors wait pinned beneath the kits, so
 * "on screen" is not "seen": they count as seen only when the kits above
 * have scrolled off them. From then on the section is marked `data-dripping`,
 * and its drips run down; that mark is never taken off, so scrolling away and
 * back changes nothing, and only a fresh load starts them again.
 *
 * `data-live` is on while the chips are really in view (not under the kits,
 * not scrolled away), and only pauses or resumes the endless motion (a bead sliding down a drip, a drop falling from
 * its tip), so nothing runs while it cannot be seen.
 *
 * `data-armed` tells the stylesheet that this script is here, so that without
 * it the drips are simply drawn run, not hidden.
 */
export function DripWatch() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = marker.current?.closest<HTMLElement>('section');
    const strip = section?.querySelector('.strip');
    const kits = section?.previousElementSibling;
    if (!section || !strip || !kits) return;
    section.dataset.armed = '';

    let frame = 0;
    const check = () => {
      frame = 0;
      const vh = window.innerHeight;
      const s = strip.getBoundingClientRect();
      const uncovered = kits.getBoundingClientRect().bottom < vh * 0.5;   // the kits have gone off the chips
      const onScreen = s.bottom > 0 && s.top < vh;
      const live = uncovered && onScreen;
      if (live) section.dataset.dripping = '';
      if (live) section.dataset.live = ''; else delete section.dataset.live;
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(check); };

    check();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
    };
  }, []);

  return <span ref={marker} hidden />;
}
