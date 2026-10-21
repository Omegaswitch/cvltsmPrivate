'use client';

import { useEffect } from 'react';

/*
 * Click a kit or render picture to see it larger. The picture itself travels:
 * it grows from where it sits on the page to the middle of the screen (and
 * shrinks back), so the eye follows one object instead of a pop-up appearing.
 * Built on the Web Animations API, transform and opacity only, one easing;
 * closing is the same animation played backwards, so closing (or clicking
 * again) halfway is as smooth as finishing. Inside, Prev / Next (or the arrow
 * keys, or a swipe) step through the other pictures of the same section.
 * Ported from the GMK Liminal site, where it began.
 *
 * It looks for `.zoom` buttons (a kit or render that has its picture puts one
 * over it) and opens the picture beside them; a larger file, where an image
 * has `data-full`, loads in while it opens and is swapped in once decoded.
 * Everything it builds is its own: the page's markup is not touched.
 */

const OPEN_MS = 760, CLOSE_RATE = 1.35, EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

export function Lightbox() {
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const box = document.createElement('div');
    box.className = 'lb';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Larger picture');
    box.innerHTML =
      '<div class="lb-back"></div><figure class="lb-fig"><div class="lb-frame"><img class="lb-img" alt=""></div></figure>' +
      '<button type="button" class="lb-close" aria-label="Close">Close</button>' +
      '<button type="button" class="lb-step lb-prev" aria-label="Previous picture">Prev</button>' +
      '<button type="button" class="lb-step lb-next" aria-label="Next picture">Next</button>';
    document.body.append(box);
    const q = <T extends HTMLElement>(s: string) => box.querySelector(s) as T;
    const back = q('.lb-back'), frame = q('.lb-frame'), img = q<HTMLImageElement>('.lb-img'), closeBtn = q('.lb-close');
    const steps = [...box.querySelectorAll<HTMLElement>('.lb-step')];

    let state: 'closed' | 'open' | 'closing' = 'closed';
    let anims: Animation[] = [];
    let opener: HTMLElement | null = null;
    let thumb: HTMLImageElement | null = null;
    let group: HTMLElement[] = [];
    const duration = reduced ? 1 : OPEN_MS;

    // shows btn's picture in the frame and builds the travel between its place on the page and the middle of the screen
    const show = (btn: HTMLElement): Animation[] => {
      opener = btn;
      thumb = btn.parentElement!.querySelector('img')!;
      const shown = thumb.getBoundingClientRect();
      img.src = thumb.currentSrc || thumb.src;
      img.alt = thumb.alt;
      frame.style.setProperty('--ar', String((thumb.naturalWidth || 1) / (thumb.naturalHeight || 1)));
      box.hidden = false;
      const to = frame.getBoundingClientRect();                     // where CSS puts it: centred, as large as fits
      const opts: KeyframeAnimationOptions = { duration, easing: EASE, fill: 'both' };
      thumb.style.visibility = 'hidden';                            // the travelling copy stands in for it
      const full = thumb.dataset.full;                              // the larger file arrives while it opens
      if (full) {
        const big = new Image();
        big.src = full;
        const mine = btn;
        big.decode().then(() => { if (opener === mine && state !== 'closed') img.src = full; }, () => {});
      }
      // stepped to a picture that is off screen: it fades in and out where it is instead of travelling
      if (shown.bottom < 0 || shown.top > innerHeight) {
        return [
          frame.animate([{ opacity: 0, transform: `translate(${to.width * 0.02}px, ${to.height * 0.02}px) scale(0.96)` }, { opacity: 1, transform: 'none' }], opts),
          img.animate([{ transform: 'none' }, { transform: 'none' }], opts),
        ];
      }
      const k = shown.width / to.width;
      return [
        frame.animate([{ transform: `translate(${shown.left - to.left}px, ${shown.top - to.top}px) scale(${k})` }, { transform: 'none' }], opts),
        img.animate([{ transform: 'none' }, { transform: 'none' }], opts),
      ];
    };

    const open = (btn: HTMLElement) => {
      if (state !== 'closed') return;
      group = [...(btn.closest('section') ?? document).querySelectorAll<HTMLElement>('.zoom')];   // the pictures of the same section, in page order
      steps.forEach((s) => { s.hidden = group.length < 2; });
      state = 'open';
      const fade = { duration: duration * 0.5, delay: duration * 0.4, easing: 'ease-out', fill: 'both' } as const;
      anims = [
        ...show(btn),
        back.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing: 'ease-out', fill: 'both' }),
        ...[closeBtn, ...steps].map((b) => b.animate([{ opacity: 0 }, { opacity: 1 }], fade)),
      ];
      closeBtn.focus({ preventScroll: true });
    };

    // the next or previous picture of the section: a quick cross-fade in the frame, and the close travels back to its place
    const step = (dir: number) => {
      if (state !== 'open' || group.length < 2 || !opener) return;
      const next = group[(group.indexOf(opener) + dir + group.length) % group.length];
      let out: Animation | null = null;
      const swap = () => {
        out?.cancel();
        anims.slice(0, 2).forEach((a) => a.cancel());
        if (thumb) thumb.style.visibility = '';
        const travel = show(next);
        travel.forEach((a) => a.finish());
        anims.splice(0, 2, ...travel);
        if (!reduced) img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
      };
      if (reduced) swap();
      else {
        out = img.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'ease-in', fill: 'forwards' });
        out.finished.then(() => (state === 'open' ? swap() : out?.cancel()), () => {});
      }
    };

    const close = () => {
      if (state !== 'open') return;
      state = 'closing';
      anims.forEach((a) => { a.updatePlaybackRate(CLOSE_RATE); a.reverse(); });
      anims[0].finished.then(() => {
        if (state !== 'closing') return;                            // opened again meanwhile
        anims.forEach((a) => a.cancel());
        box.hidden = true;
        state = 'closed';
        if (thumb) thumb.style.visibility = '';
        opener?.focus({ preventScroll: true });
        opener = thumb = null;
      }, () => {});
    };

    // clicking again halfway through a close turns it round, smoothly
    const reopen = () => {
      state = 'open';
      anims.forEach((a) => { a.updatePlaybackRate(1); a.reverse(); });
    };

    const onClick = (e: MouseEvent) => {
      const t = e.target as Element;
      const zoom = t.closest?.('.zoom') as HTMLElement | null;
      if (zoom) { e.preventDefault(); open(zoom); return; }
      const s = t.closest?.('.lb-step');
      if (s) { step(s.classList.contains('lb-prev') ? -1 : 1); return; }
      if (!box.hidden && (t.closest('.lb-close') || !t.closest('.lb-frame'))) { if (state === 'open') close(); else reopen(); }
    };
    const onKey = (e: KeyboardEvent) => {
      if (box.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (state === 'open') close(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); step(e.key === 'ArrowLeft' ? -1 : 1); }
      else if (e.key === 'Tab') {                                   // focus stays on the dialog's own buttons
        e.preventDefault();
        const ctl = [closeBtn, ...steps].filter((b) => !b.hidden);
        const i = ctl.indexOf(document.activeElement as HTMLElement);
        ctl[(i + (e.shiftKey ? -1 : 1) + ctl.length) % ctl.length].focus({ preventScroll: true });
      }
    };
    document.addEventListener('click', onClick);
    addEventListener('keydown', onKey, true);

    // a sideways swipe steps too
    let x0: number | null = null;
    box.addEventListener('touchstart', (e) => { x0 = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
    box.addEventListener('touchend', (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    });
    // the page behind stays put
    const hold = (e: Event) => { if (!box.hidden) e.preventDefault(); };
    box.addEventListener('wheel', hold, { passive: false });
    box.addEventListener('touchmove', hold, { passive: false });

    return () => {
      document.removeEventListener('click', onClick);
      removeEventListener('keydown', onKey, true);
      anims.forEach((a) => a.cancel());
      if (thumb) thumb.style.visibility = '';
      box.remove();
    };
  }, []);

  return null;
}
