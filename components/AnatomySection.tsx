'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { setupGsap, ScrollTrigger } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/useMedia';
import { ANATOMY } from '@/data/anatomy';
import { ExplodedObject } from './ExplodedObject';

/**
 * Chapter 03. Back to black. A tall scroll track holds a sticky stage. As the
 * visitor descends the layers come apart, slowly, and the annotations travel
 * with them. Reduced motion keeps the stack assembled at its exploded state.
 */
export function AnatomySection() {
  const root = useRef<HTMLElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(() => {
    setupGsap();
    const el = stack.current;
    if (!el) return;
    if (reduced) {
      el.style.setProperty('--explode', '1');
      return;
    }
    // The stack opens with a long, even ease: it is scrubbed to scroll, so the
    // pace is the visitor's, and there is no spring anywhere.
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
      onUpdate: (self) => {
        el.style.setProperty('--explode', self.progress.toFixed(4));
      },
    });
    return () => st.kill();
  }, { scope: root, dependencies: [reduced] });

  return (
    <section id="anatomy" ref={root} className="anatomy sec--black" data-chapter="anatomy">
      <div className="anatomy__sticky">
        <div className="anatomy__head">
          <p className="meta">CHAPTER 03 — ANATOMY</p>
          <p className="meta">EXPLODED · 5 LAYERS · NOT TO SCALE</p>
        </div>

        <div ref={stack} className="anatomy__field" style={{ ['--explode' as string]: 0 }}>
          <ExplodedObject layers={ANATOMY} />
        </div>

        <div className="anatomy__foot">
          <p className="meta">DIMENSIONS PLACEHOLDER — SEE DRAWING 03.A</p>
          <p className="meta">FIG. 3.1</p>
        </div>
      </div>
    </section>
  );
}
