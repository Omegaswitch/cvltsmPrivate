'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { setupGsap, ScrollTrigger } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/useMedia';
import { RUNES } from '@/data/runes';

/**
 * Chapter 08. Full black. Almost nothing is visible at the top. The scroll
 * brings up one rune and keeps enlarging it until it fills the viewport, then
 * the words arrive, and the page hard-cuts on. No glitch, no jump: scale and silence.
 */
export function VoidSection() {
  const root = useRef<HTMLElement>(null);
  const glyph = useRef<HTMLSpanElement>(null);
  const words = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const rune = RUNES[23]; // OTHALA

  useGSAP(() => {
    setupGsap();
    const g = glyph.current;
    const w = words.current;
    if (!g || !w) return;
    if (reduced) {
      g.style.opacity = '1';
      g.style.transform = 'scale(6)';
      w.style.opacity = '1';
      return;
    }
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
      onUpdate: (self) => {
        const p = self.progress;
        // the rune comes up out of the dark, then grows past the viewport
        const reveal = Math.min(1, p / 0.22);
        const grow = p < 0.3 ? 1 : 1 + ((p - 0.3) / 0.7) * 26;
        g.style.opacity = String(reveal * 0.82);
        g.style.transform = `scale(${grow.toFixed(3)})`;
        w.style.opacity = String(Math.min(1, Math.max(0, (p - 0.78) / 0.12)));
      },
    });
    return () => st.kill();
  }, { scope: root, dependencies: [reduced] });

  return (
    <section id="void" ref={root} className="void sec--black" data-chapter="void" aria-label="Void">
      <div className="void__sticky">
        <span ref={glyph} className="void__glyph" aria-hidden="true">{rune.glyph}</span>
        <p ref={words} className="void__words">DO NOT INVOKE</p>
      </div>
    </section>
  );
}
