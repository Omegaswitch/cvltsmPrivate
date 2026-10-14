'use client';

import { useEffect } from 'react';

/*
 * The menu's links to the sections glide there, quickly, instead of jumping:
 * one ease in and out, a little longer the farther it goes (0.45 to 0.8s).
 * A wheel, touch or key from the visitor stops it at once. Under reduced
 * motion it is the plain jump.
 *
 * A pinned (sticky) section is measured where it is uncovered, not where it
 * is drawn: the colors sit pinned beneath the kits, so their own box says
 * they are already on screen while the kits still cover them. Their place is
 * where the section before them ends.
 */

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
let frame = 0;

function stop() {
  cancelAnimationFrame(frame);
  frame = 0;
}

/** Scroll the page to `top` (px), gliding unless motion is reduced. */
export function glide(top: number) {
  stop();
  const from = window.scrollY;
  const to = Math.max(0, Math.min(top, document.documentElement.scrollHeight - window.innerHeight));
  const distance = to - from;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(distance) < 2) {
    window.scrollTo(0, to);
    return;
  }
  const duration = Math.min(800, Math.max(450, Math.abs(distance) * 0.18));
  const t0 = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / duration);
    window.scrollTo(0, from + distance * ease(t));
    frame = t < 1 ? requestAnimationFrame(step) : 0;
  };
  frame = requestAnimationFrame(step);
}

/** Where a section starts on the page, as the visitor will see it. */
function placeOf(el: HTMLElement) {
  const before = el.previousElementSibling;
  if (getComputedStyle(el).position === 'sticky' && before) {
    return before.getBoundingClientRect().bottom + window.scrollY;
  }
  return el.getBoundingClientRect().top + window.scrollY;
}

/** Makes the in-page links inside its parent glide. Render once in the menu. */
export function Glide() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      const target = link && document.getElementById(link.hash.slice(1));
      if (!target) return;
      e.preventDefault();
      history.pushState(null, '', link.hash);
      glide(placeOf(target));
    };
    const events = ['wheel', 'touchstart', 'keydown'] as const;
    document.addEventListener('click', onClick);
    events.forEach((ev) => window.addEventListener(ev, stop, { passive: true }));
    return () => {
      document.removeEventListener('click', onClick);
      events.forEach((ev) => window.removeEventListener(ev, stop));
      stop();
    };
  }, []);
  return null;
}
