'use client';

import { useEffect, useRef } from 'react';
import { FILM, DISSOLVE, clipSrc, posterSrc, type Format } from '@/data/film';

/*
 * The opening film. Two video elements take turns: the next clip starts on
 * top of the one still playing and dissolves in over it, so the picture never
 * drops to black between clips. Some arrivals are broken, for under a second,
 * by interference in the signal (data-interfere on the root; the look is in
 * globals.css). Over the footage lie a looping pass of film damage and the
 * grime of the concrete.
 *
 * Nothing plays for anyone who has asked for reduced motion or less data:
 * they see the first poster frame. It stops whenever it is out of sight.
 */

export function Film() {
  const root = useRef<HTMLDivElement>(null);
  const a = useRef<HTMLVideoElement>(null);
  const b = useRef<HTMLVideoElement>(null);
  const damage = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = root.current;
    const va = a.current;
    const vb = b.current;
    if (!el || !va || !vb) return;
    const videos = [va, vb];
    const size = window.matchMedia('(max-width: 820px)').matches ? 'sm' : 'lg';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    // VP9 where the browser has it (smaller), H.264 everywhere else
    const format: Format = va.canPlayType('video/webm; codecs="vp9"') ? 'webm' : 'mp4';

    let front = 0;           // which element is showing
    let current = 0;         // which clip it shows
    let switching = false;
    let timers: number[] = [];
    let visible = true;
    let tabShown = !document.hidden;

    const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)); };

    // where to put a wide picture in a taller frame so the subject stays in
    // view: the x% of object-position that centres `focus` (0 to 1)
    const position = (focus: number, aspect: number) => {
      const c = el.clientWidth;
      const w = el.clientHeight * aspect;
      if (w <= c) return '50%';
      return `${Math.min(100, Math.max(0, ((focus * w - c / 2) / (w - c)) * 100)).toFixed(1)}%`;
    };

    const load = (v: HTMLVideoElement, clip: number) => {
      v.style.objectPosition = `${position(FILM[clip].focus, FILM[clip].aspect)} 50%`;
      v.src = clipSrc(FILM[clip].id, size, format);
      v.load();
    };

    const startNext = () => {
      if (switching) return;
      switching = true;
      const next = (current + 1) % FILM.length;
      const incoming = videos[1 - front];
      const outgoing = videos[front];
      load(incoming, next);
      incoming.play().then(() => {
        // the incoming clip goes on top, transparent, and dissolves in
        incoming.classList.remove('is-shown', 'is-under');
        void incoming.offsetWidth;
        incoming.classList.add('is-shown');
        outgoing.classList.replace('is-shown', 'is-under');
        if (FILM[next].into === 'interference') {
          el.dataset.interfere = '';
          later(() => { delete el.dataset.interfere; }, 850);
        }
        later(() => {
          outgoing.pause();
          outgoing.classList.remove('is-shown', 'is-under');
          switching = false;
        }, DISSOLVE * 1000);
        front = 1 - front;
        current = next;
      }).catch(() => { switching = false; outgoing.loop = true; });
    };

    const onTime = (e: Event) => {
      const v = e.currentTarget as HTMLVideoElement;
      if (v !== videos[front]) return;
      if (v.duration && v.currentTime >= v.duration - DISSOLVE) startNext();
    };
    videos.forEach((v) => v.addEventListener('timeupdate', onTime));

    const sync = () => {
      if (wanted && visible && tabShown) {
        videos[front].play().catch(() => {});
        damage.current?.play().catch(() => {});
      } else {
        videos.forEach((v) => v.pause());
        damage.current?.pause();
      }
    };

    const wanted = !reduced && !saveData;
    if (wanted) {
      load(va, 0);
      va.classList.add('is-shown');
      // the damage pass waits for the first clip, so it never competes with it
      if (damage.current && size === 'lg') {
        va.addEventListener('playing', () => {
          const d = damage.current;
          if (!d) return;
          d.src = `/film/damage.${format}`;
          d.load();
          sync();
        }, { once: true });
      }
      sync();
    }

    // out of sight: when the kits have covered it, or the tab is hidden.
    // Once fully covered the whole hero is hidden too: it is pinned behind
    // every section, and its moving layers would otherwise go on repainting
    // under them all the way down the page.
    const hero = el.closest<HTMLElement>('.hero');
    const onScroll = () => {
      const now = window.scrollY < window.innerHeight * 0.98;
      if (now !== visible) { visible = now; sync(); }
      const covered = window.scrollY >= window.innerHeight;
      if (hero && covered !== 'covered' in hero.dataset) { if (covered) hero.dataset.covered = ''; else delete hero.dataset.covered; }
    };
    onScroll();
    const onTab = () => { tabShown = !document.hidden; sync(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onTab);

    return () => {
      timers.forEach(clearTimeout);
      timers = [];
      videos.forEach((v) => { v.removeEventListener('timeupdate', onTime); v.pause(); });
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onTab);
    };
  }, []);

  return (
    <div ref={root} className="film" aria-hidden="true">
      {/* the first frame, there before any video, and all there is without motion */}
      <img className="film__poster" src={posterSrc(FILM[0].id)} alt="" fetchPriority="high" decoding="async" />
      <video ref={a} className="film__clip" muted playsInline preload="none" disablePictureInPicture />
      <video ref={b} className="film__clip" muted playsInline preload="none" disablePictureInPicture />
      <video ref={damage} className="film__damage" muted playsInline loop preload="none" disablePictureInPicture />
      <div className="film__grime" />
      <div className="film__tint" />
      <div className="film__scratches" />
      <div className="film__interference" />
      <div className="film__shade" />
    </div>
  );
}
