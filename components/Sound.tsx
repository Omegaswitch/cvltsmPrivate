'use client';

import { useEffect, useRef, useState } from 'react';
import { DaubButton } from './Daub';

/*
 * The ambient track. Browsers keep a page silent until the visitor does
 * something, so it begins on the first click, tap or key press, fading in
 * over three seconds, and the control at the foot of the screen turns it off
 * and on. The choice is kept on the visitor's own device; a visitor who
 * turned it off is not played to again. It is silent whenever the tab is
 * hidden, at once, since a hidden tab runs no animation frames to fade with.
 * Where the browser does not let a page set the volume (iOS), it just starts
 * and stops.
 */

const LEVEL = 0.5;       // the loudest it gets, of the file's own level
const FADE_IN = 3000;    // ms to fade in from silence, the first time
const FADE_ON = 1200;    // ms to fade in when asked
const FADE_OFF = 700;    // ms to fade out when asked, so the control answers
const KEY = 'cvltsm-sound';

const stored = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const store = (v: 'on' | 'off') => { try { localStorage.setItem(KEY, v); } catch { /* private mode: the choice just lasts the visit */ } };

export function Sound() {
  const audio = useRef<HTMLAudioElement>(null);
  const [on, setOn] = useState(false);
  const wanted = useRef(false);        // the visitor wants sound
  const tabShown = useRef(true);
  const level = useRef({ from: 0, to: 0, t0: 0, raf: 0, fades: true });

  // move the volume toward `to`, easing over `ms` (in proportion to the
  // distance, so a turn-around mid-fade is not slow); pause at silence
  const fadeTo = (to: number, ms: number) => {
    const a = audio.current;
    const l = level.current;
    if (!a) return;
    cancelAnimationFrame(l.raf);
    l.from = a.volume; l.to = to; l.t0 = performance.now();
    if (to > 0) a.play().catch(() => {});
    if (!l.fades || ms === 0) {
      a.volume = to;
      if (to === 0) a.pause();
      return;
    }
    const span = ms * Math.abs(to - l.from) / LEVEL;
    const step = (now: number) => {
      const k = Math.min(1, (now - l.t0) / span);
      a.volume = l.from + (l.to - l.from) * (k * k * (3 - 2 * k));
      if (k < 1) l.raf = requestAnimationFrame(step);
      else if (l.to === 0) a.pause();
    };
    l.raf = requestAnimationFrame(step);
  };

  const apply = (ms?: number) => {
    const play = wanted.current && tabShown.current;
    fadeTo(play ? LEVEL : 0, play ? (ms ?? FADE_ON) : (tabShown.current ? FADE_OFF : 0));
  };

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const l = level.current;
    a.volume = 0.5;
    l.fades = a.volume === 0.5;   // iOS ignores it
    a.volume = 0;

    // first gesture: start, unless the visitor turned it off before, or is
    // pressing the control itself (its own click decides)
    const begin = (e: Event) => {
      cleanup();
      if (stored() === 'off' || (e.target as Element | null)?.closest?.('.sound')) return;
      wanted.current = true;
      setOn(true);
      apply(FADE_IN);
    };
    const events = ['pointerdown', 'keydown'] as const;
    const cleanup = () => events.forEach((e) => window.removeEventListener(e, begin));
    events.forEach((e) => window.addEventListener(e, begin, { once: true }));

    const onTab = () => { tabShown.current = !document.hidden; if (wanted.current) apply(); };
    document.addEventListener('visibilitychange', onTab);
    return () => {
      cleanup();
      document.removeEventListener('visibilitychange', onTab);
      cancelAnimationFrame(l.raf);
      a.pause();
    };
  }, []);

  const toggle = () => {
    wanted.current = !on;
    store(wanted.current ? 'on' : 'off');
    setOn(wanted.current);
    apply();
  };

  const label = on ? 'Sound on' : 'Sound off';
  return (
    <>
      <audio ref={audio} loop preload="none">
        <source src="/audio/ambient.ogg" type="audio/ogg; codecs=opus" />
        <source src="/audio/ambient.mp3" type="audio/mpeg" />
      </audio>
      <DaubButton className="sound" onClick={toggle} aria-pressed={on} aria-label="Sound" label={label}>{label}</DaubButton>
    </>
  );
}
