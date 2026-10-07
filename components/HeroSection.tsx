'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { setupGsap, ScrollTrigger } from '@/lib/gsap';
import { progress } from '@/lib/progress';
import { useReducedMotion } from '@/lib/useMedia';
import { LazyScene } from './LazyScene';
import { Plate } from './Plate';
import { HERO_POSTER } from '@/data/assets';

/**
 * Chapter 01. Nearly black. The object is found in a single narrow light, and
 * the scroll brings it up and in. The type sits over it, and the object is
 * allowed to overlap the word.
 */
export function HeroSection() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(() => {
    setupGsap();
    if (reduced) {
      // a still composition: the object is shown once, fully emerged
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
    <section id="discovery" ref={root} className="hero sec--black" data-chapter="discovery">
      <LazyScene
        mode="hero"
        className="hero__scene"
        poster={<Plate plate={HERO_POSTER} className="hero__poster" eager />}
      />

      <div className="hero__meta hero__meta--tl">
        <p>AN OBJECT IN 108 PARTS</p>
        <p>NORDIC RITUAL KEYCAP STUDY</p>
      </div>
      <div className="hero__meta hero__meta--tr">
        <p>MMXXVI</p>
      </div>

      <h1 className="hero__word" aria-label="Ritual">
        <span>RITUAL</span>
      </h1>

      <a className="hero__descend" href="#object">
        <span aria-hidden="true">↓</span> DESCEND
      </a>
    </section>
  );
}
