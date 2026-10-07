'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { setupGsap, ScrollTrigger } from '@/lib/gsap';
import { progress } from '@/lib/progress';
import { useReducedMotion } from '@/lib/useMedia';
import { SET } from '@/data/site';
import { LazyScene } from './LazyScene';

/**
 * The opening. Void, the wordmark, and the keyboard coming up out of the dark
 * as the page scrolls. The keyboard is a stand-in until the production model
 * exists; see components/KeyboardModel.tsx.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(() => {
    setupGsap();
    if (reduced) {
      progress.hero = 1;
      return;
    }
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.6,
      onUpdate: (self) => { progress.hero = self.progress; },
    });
    return () => { st.kill(); progress.hero = 0; };
  }, { scope: root, dependencies: [reduced] });

  return (
    <section id="top" ref={root} className="hero">
      <LazyScene className="hero__scene" poster={<div className="hero__poster" aria-hidden="true" />} />

      <div className="hero__text">
        {/* manufacturer slot: reserved height, so the wordmark does not move when the mark arrives */}
        <div className="hero__mfr">
          {SET.manufacturerLogo ? <img src={SET.manufacturerLogo} alt="Manufacturer" /> : null}
        </div>
        <h1 className="hero__word">{SET.name}</h1>
        <p className="hero__line">{SET.line}</p>
        <a className="hero__link" href="#kits">View the kits</a>
      </div>
    </section>
  );
}
