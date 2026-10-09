'use client';

import { useEffect, useRef, useState } from 'react';
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
 * they see the first poster frame and can start the film themselves. It
 * stops whenever it is out of sight.
 */

const pad = (n: number) => String(n).padStart(2, '0');

export function Film() {
  const root = useRef<HTMLDivElement>(null);
  const a = useRef<HTMLVideoElement>(null);
  const b = useRef<HTMLVideoElement>(null);
  const damage = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const [second, setSecond] = useState(0);
  const [state, setState] = useState<'still' | 'playing' | 'paused'>('still');
  const wanted = useRef(false);        // the film should run (autoplay allowed, or asked for)
  const control = useRef<{ resume: () => void; halt: () => void } | null>(null);

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

    const load = (v: HTMLVideoElement, clip: number) => {
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
        setIndex(next);
      }).catch(() => { switching = false; outgoing.loop = true; });
    };

    const onTime = (e: Event) => {
      const v = e.currentTarget as HTMLVideoElement;
      if (v !== videos[front]) return;
      setSecond(Math.floor(v.currentTime));
      if (v.duration && v.currentTime >= v.duration - DISSOLVE) startNext();
    };
    videos.forEach((v) => v.addEventListener('timeupdate', onTime));

    const running = () => wanted.current && visible && tabShown;
    const sync = () => {
      if (running()) {
        videos[front].play().catch(() => {});
        damage.current?.play().catch(() => {});
        setState('playing');
      } else {
        videos.forEach((v) => v.pause());
        damage.current?.pause();
        // out of sight only: still 'playing' as far as the control is concerned
      }
    };

    let begun = false;
    const begin = () => {
      if (begun) return;
      begun = true;
      load(va, 0);
      va.classList.add('is-shown');
      if (damage.current && size === 'lg') {
        damage.current.src = `/film/damage.${format}`;
        damage.current.load();
      }
      sync();
    };

    control.current = {
      resume: () => { wanted.current = true; begin(); sync(); setState('playing'); },
      halt: () => { wanted.current = false; sync(); setState('paused'); },
    };

    if (!reduced && !saveData) control.current.resume();

    // out of sight: when the colophon has covered it, or the tab is hidden
    const onScroll = () => {
      const now = window.scrollY < window.innerHeight * 0.98;
      if (now !== visible) { visible = now; sync(); }
    };
    const onTab = () => { tabShown = !document.hidden; sync(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onTab);

    return () => {
      timers.forEach(clearTimeout);
      timers = [];
      videos.forEach((v) => { v.removeEventListener('timeupdate', onTime); v.pause(); });
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onTab);
      control.current = null;
    };
  }, []);

  const toggle = () => {
    if (state === 'playing') control.current?.halt();
    else control.current?.resume();
  };

  return (
    <>
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

      <div className="reel">
        <span className="reel__count">{pad(index + 1)}<span className="reel__of"> / {pad(FILM.length)}</span></span>
        <span className="reel__time">00:{pad(second)}</span>
        <button type="button" className="reel__toggle" onClick={toggle} aria-pressed={state === 'playing'}>
          {state === 'playing' ? 'Pause' : 'Play'}
        </button>
      </div>
    </>
  );
}
