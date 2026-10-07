'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

/** Registers ScrollTrigger once, on the client only. */
export function setupGsap(): void {
  if (!registered && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    // mobile browsers resize the viewport as their toolbars move; without this
    // every scrub would jump when the address bar collapses
    ScrollTrigger.config({ ignoreMobileResize: true });
    registered = true;
  }
}

export { ScrollTrigger };
