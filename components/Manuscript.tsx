'use client';

import { useEffect, useRef } from 'react';

/*
 * Text on old paper. Hidden words, marked [[word]] in the source, share the
 * ink of the rest until a cursor or a finger passes near them. Then they
 * ignite, and when it moves away they cool slowly, like embers.
 *
 * `page` is the fixed sheet behind the home page; it drifts a little against
 * the scroll. `inline` sets the text in the flow of a page (the rite pages).
 */

const RADIUS = 120;          // px from a word's centre at which it starts to warm
const COOL = 0.4;            // fraction of heat a word keeps per second once left alone

function words(paragraph: string, key: string) {
  return paragraph.split(/(\[\[[^\]]+\]\])/).map((part, i) =>
    part.startsWith('[[')
      ? <span key={`${key}-${i}`} className="mword">{part.slice(2, -2)}</span>
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
        const r = w.getBoundingClientRect();
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        const target = Math.max(0, 1 - d / RADIUS);
        const h = target >= heat[i]
          ? heat[i] + (target - heat[i]) * Math.min(1, dt * 12)
          : (reduced ? target : heat[i] * Math.pow(COOL, dt));
        const next = h < 0.004 ? 0 : Math.min(1, h);
        if (Math.abs(next - heat[i]) > 0.002 || (next === 0 && heat[i] !== 0)) w.style.setProperty('--heat', next.toFixed(3));
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

    // the sheet drifts a little against the scroll, so it sits behind the page
    const drift = () => {
      if (variant === 'page' && text.current && !reduced) {
        text.current.style.transform = `translate3d(0, ${(-window.scrollY * 0.06).toFixed(1)}px, 0)`;
      }
      kick();
    };

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchend', away, { passive: true });
    document.addEventListener('pointerleave', away);
    window.addEventListener('scroll', drift, { passive: true });
    drift();
    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchend', away);
      document.removeEventListener('pointerleave', away);
      window.removeEventListener('scroll', drift);
      if (raf) cancelAnimationFrame(raf);
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
