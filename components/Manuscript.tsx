'use client';

import { useEffect, useRef } from 'react';

/*
 * Text on old paper. Hidden words, marked [[word]] in the source, share the
 * ink of the rest until a cursor or a finger passes near them. Then they
 * ignite, and when it moves away they cool slowly, like embers.
 *
 * `page` is the fixed sheet behind the home page; it stays still while the
 * page scrolls over it, and its text fades out as the opening scrolls away,
 * so it never runs behind the sections. `inline` sets the text in the flow of a page (the
 * rite pages).
 */

const RADIUS = 140;          // px from a word's centre at which it starts to warm
const COOL = 0.4;            // fraction of heat a word keeps per second once left alone
const FLICKER = 0.12;        // how far a lit word's brightness wavers, like a coal in a draught

/** Smooth noise in 0..1 from two slow sines per word; no two words waver in step. */
function flicker(t: number, i: number) {
  return 0.5 + 0.3 * Math.sin(t / 97 + i * 1.7) + 0.2 * Math.sin(t / 41 + i * 4.3);
}

function words(paragraph: string, key: string) {
  return paragraph.split(/(\[\[[^\]]+\]\])/).map((part, i) =>
    part.startsWith('[[')
      ? <span key={`${key}-${i}`} className="mword" data-word={part.slice(2, -2)}>{part.slice(2, -2)}</span>
      : part,
  );
}

export function Manuscript({ paragraphs, variant = 'page' }: { paragraphs: string[]; variant?: 'page' | 'inline' }) {
  const root = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const marked = [...el.querySelectorAll<HTMLElement>('.mword')];
    const heat = marked.map(() => 0);
    const fixed = variant === 'page';
    // where each word sits, measured once and again on resize, so the frame
    // loop never asks the browser for layout while the page scrolls
    let centres: { x: number; y: number }[] = [];
    const measure = () => {
      const dy = fixed ? 0 : window.scrollY;
      centres = marked.map((w) => {
        const r = w.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 + dy };
      });
    };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let px = -1e4;
    let py = -1e4;
    let raf = 0;
    let last = 0;

    const tick = (now: number) => {
      // a frame's timestamp can precede the moment the loop was started, so
      // the first step is taken as one frame, and no step is ever negative
      const dt = last ? Math.min(0.1, Math.max(0, (now - last) / 1000)) : 1 / 60;
      last = now;
      let warm = false;
      marked.forEach((w, i) => {
        const c = centres[i];
        const d = Math.hypot(px - c.x, py - (c.y - (fixed ? 0 : window.scrollY)));
        const near = Math.max(0, 1 - d / RADIUS);
        const target = near * near * (3 - 2 * near); // eased, so the heat comes on softly at the rim
        const h = target >= heat[i]
          ? heat[i] + (target - heat[i]) * Math.min(1, dt * 12)
          : (reduced ? target : heat[i] * Math.pow(COOL, dt));
        const next = h < 0.004 ? 0 : Math.min(1, h);
        // the flicker changes what is shown, never the heat itself, so it cannot keep a word lit
        const shown = next && !reduced ? next * (1 - FLICKER * 0.5 + FLICKER * flicker(now, i)) : next;
        if (next || heat[i]) w.style.setProperty('--heat', Math.min(1, shown).toFixed(3));
        heat[i] = next;
        if (heat[i] > 0) warm = true;
      });
      raf = warm ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    const onPointer = (e: PointerEvent) => { px = e.clientX; py = e.clientY; kick(); };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) { px = t.clientX; py = t.clientY; kick(); }
    };
    const away = () => { px = -1e4; py = -1e4; kick(); };

    // in the flow of a page the words move with the scroll, so the pointer
    // has to be tested again; the fixed sheet needs nothing
    let fading = 0;
    const fade = () => {
      fading = 0;
      const t = text.current;
      if (t) t.style.opacity = String(Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.7)));
    };
    const onScroll = () => {
      if (fixed) { if (!fading) fading = requestAnimationFrame(fade); return; }
      if (px > -1e3) kick();
    };

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchend', away, { passive: true });
    document.addEventListener('pointerleave', away);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    measure();
    if (fixed) fade();
    document.fonts?.ready.then(measure);
    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchend', away);
      document.removeEventListener('pointerleave', away);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      if (raf) cancelAnimationFrame(raf);
      if (fading) cancelAnimationFrame(fading);
    };
  }, [variant]);

  return (
    <div ref={root} className={`manuscript manuscript--${variant}`} aria-hidden={variant === 'page' ? true : undefined}>
      <div ref={text} className="manuscript__text">
        {paragraphs.map((p, i) => <p key={i}>{words(p, String(i))}</p>)}
      </div>
    </div>
  );
}
