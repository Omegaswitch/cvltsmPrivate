'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { setupGsap, ScrollTrigger, gsap } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/useMedia';
import { RITUAL_PLATES } from '@/data/ritual';
import { Plate } from './Plate';

/**
 * Chapter 05. The rhythm breaks on purpose: plates at radically different
 * scales, pushed to alternating edges, with black between them. Each plate
 * drifts a little against the scroll, which is the only motion here.
 */
export function RitualSection() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(() => {
    setupGsap();
    if (reduced) return;
    const els = gsap.utils.toArray<HTMLElement>('[data-drift]', root.current);
    const tweens = els.map((el) =>
      gsap.fromTo(el, { yPercent: -4 }, {
        yPercent: 4,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      }),
    );
    return () => tweens.forEach((t) => t.kill());
  }, { scope: root, dependencies: [reduced] });

  return (
    <section id="ritual" ref={root} className="ritual sec--black" data-chapter="ritual">
      <div className="ritual__opening">
        <p className="meta">CHAPTER 05 — RITUAL</p>
        <h2 className="ritual__word">
          <span>SOMETHING</span>
          <span className="ritual__word--indent">WAS</span>
          <span>INVOKED.</span>
        </h2>
      </div>

      {RITUAL_PLATES.map((p) => (
        <figure key={p.label} className={`ritual__item ritual__item--${p.scale} ritual__item--${p.align}`}>
          <div className="ritual__frame" data-drift>
            <Plate plate={p.plate} className="ritual__plate" />
          </div>
          <figcaption className="meta ritual__caption">
            {p.label} · {p.site} · {p.time}
          </figcaption>
        </figure>
      ))}
    </section>
  );
}
