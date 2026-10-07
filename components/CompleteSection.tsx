'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { setupGsap, ScrollTrigger } from '@/lib/gsap';
import { progress } from '@/lib/progress';
import { useReducedMotion } from '@/lib/useMedia';
import { COMPLETE_POSTER } from '@/data/assets';
import { LazyScene } from './LazyScene';
import { Plate } from './Plate';

/**
 * Chapter 09. The cleanest render of the finished object, floating against
 * black: no props, no forest, no documentation. As the visitor keeps scrolling
 * it sinks into the dark and is gone.
 */
export function CompleteSection() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(() => {
    setupGsap();
    if (reduced) return;
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: (self) => { progress.complete = self.progress; },
    });
    return () => { st.kill(); progress.complete = 0; };
  }, { scope: root, dependencies: [reduced] });

  return (
    <section id="complete" ref={root} className="complete sec--black" data-chapter="complete">
      <div className="complete__sticky">
        <LazyScene
          mode="complete"
          className="complete__scene"
          poster={<Plate plate={COMPLETE_POSTER} className="complete__poster" />}
        />
        <div className="complete__meta meta">
          <p>RITUAL</p>
          <p>COMPLETE OBJECT</p>
          <p>2026</p>
        </div>
      </div>
    </section>
  );
}
