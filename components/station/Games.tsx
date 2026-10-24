'use client';

import { useEffect, useRef, useState } from 'react';
import { station } from './api';

/*
 * The two instruments the terminal opens.
 *
 * Runes: the twenty-four signs of stone 1, in the order they were cut. The
 * visitor gives each a letter; stone 7 reads itself back with whatever they
 * have given, live, and they can try the reading as a key. Nothing here knows
 * the answer: the server checks it. The nine signs stone 7 uses are marked on
 * the board; a letter given moves the keyboard on to the next sign, and Enter
 * tries the word once all nine are there.
 *
 * Tune: a receiver dial. The scope is static at every frequency (it gives
 * nothing away); locking the dial asks the server whether the carrier is
 * there. Only then does the trace settle into a wave.
 */

export const FUTHARK = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ'.split('');
const STONE_7 = 'ᚢᛚᚠᚺᛖᛞᚾᚨᚱ'.split('');
const ASKED = new Set(STONE_7);
const MAP_KEY = 'svartskog-runes';

type Result = { ok: boolean; level?: number; error?: string };

export function Runes({ onClose, onSolved }: { onClose: () => void; onSolved: (r: Result) => void }) {
  const [map, setMap] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'trying' | 'no' | 'yes'>('idle');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    try { setMap(JSON.parse(localStorage.getItem(MAP_KEY) || '{}')); } catch { /* fresh board */ }
  }, []);
  const put = (i: number, rune: string, v: string) => {
    const letter = v.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
    const next = { ...map, [rune]: letter };
    setMap(next);
    setState('idle');
    try { localStorage.setItem(MAP_KEY, JSON.stringify(next)); } catch { /* the board lasts the visit */ }
    // one letter is a sign's usual share; move on. (ᚦ is TH: two letters, so it waits for both.)
    if (letter.length >= (rune === 'ᚦ' ? 2 : 1)) inputs.current[i + 1]?.select();
  };
  const reading = STONE_7.map((r) => map[r] || '·');
  const complete = reading.every((c) => c !== '·');
  const given = FUTHARK.filter((r) => map[r]).length;

  const tryIt = async () => {
    if (!complete || state === 'trying' || state === 'yes') return;
    setState('trying');
    const r = await station<Result>('unlock', { lock: 'stone', answer: reading.join('') });
    if (r.ok) { setState('yes'); onSolved(r); } else setState('no');
  };
  const onKey = (i: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); tryIt(); }
    else if (e.key === 'Backspace' && !e.currentTarget.value) inputs.current[i - 1]?.select();
    else if (e.key === 'ArrowRight' && e.currentTarget.selectionStart === e.currentTarget.value.length) inputs.current[i + 1]?.select();
    else if (e.key === 'ArrowLeft' && e.currentTarget.selectionStart === 0) inputs.current[i - 1]?.select();
  };

  return (
    <div className="st-game" role="dialog" aria-label="Rune board">
      <div className="st-game__head">
        <span>Rune board · stone 1 / stone 7</span>
        <button type="button" onClick={onClose}>Close</button>
      </div>
      <p className="st-game__note">Give each sign its letter. Stone 7 reads with what you give it; its nine signs are marked.</p>
      <div className="st-runes">
        {FUTHARK.map((r, i) => (
          <label key={r} className={`st-runes__cell${ASKED.has(r) ? ' is-asked' : ''}${map[r] ? ' is-given' : ''}`}>
            <span className="st-rune" aria-hidden="true">{r}</span>
            <input
              ref={(el) => { inputs.current[i] = el; }}
              value={map[r] ?? ''}
              onChange={(e) => put(i, r, e.target.value)}
              onKeyDown={onKey(i)}
              onFocus={(e) => e.currentTarget.select()}
              maxLength={2}
              aria-label={`letter for rune ${r}${ASKED.has(r) ? ', on stone 7' : ''}`}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        ))}
      </div>
      <div className="st-stone">
        <span className="st-stone__label">Stone 7</span>
        <div className="st-stone__row">
          {STONE_7.map((r, i) => (
            <span key={i} className="st-stone__sign">
              <span className="st-rune">{r}</span>
              <span className={`st-stone__letter${reading[i] === '·' ? ' is-empty' : ''}`}>{reading[i]}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="st-game__foot">
        <span className={`st-game__status st-game__status--${state}`}>
          {state === 'trying' ? 'reading…' : state === 'no' ? 'the stone does not answer to that.' : state === 'yes' ? 'it answers. journal_04.enc is open.' : complete ? 'read it as a key (Enter)' : `nine signs, one word · ${given} of 24 given`}
        </span>
        <button type="button" disabled={!complete || state === 'trying' || state === 'yes'} onClick={tryIt}>Try the word</button>
      </div>
    </div>
  );
}

export function Tune({ onClose, onSolved }: { onClose: () => void; onSolved: (r: Result) => void }) {
  const [f, setF] = useState(150);
  const [state, setState] = useState<'idle' | 'trying' | 'no' | 'yes'>('idle');
  const scope = useRef<HTMLCanvasElement>(null);
  const locked = useRef(false);
  const trying = useRef(false);
  locked.current = state === 'yes';
  trying.current = state === 'trying';

  // the trace: static everywhere, a wave only once the carrier is confirmed.
  // The canvas is sized when its box changes, not every frame (sizing clears it and costs a layout).
  useEffect(() => {
    const c = scope.current;
    const g = c?.getContext('2d');
    if (!c || !g) return;
    let raf = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const size = () => { c.width = Math.round(c.clientWidth * devicePixelRatio); c.height = Math.round(c.clientHeight * devicePixelRatio); };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(c);
    const draw = (t: number) => {
      const w = c.width, h = c.height;
      g.clearRect(0, 0, w, h);
      g.strokeStyle = '#211b19';
      g.lineWidth = 1;
      for (let x = 0; x <= 10; x++) { g.beginPath(); g.moveTo((x * w) / 10, 0); g.lineTo((x * w) / 10, h); g.stroke(); }
      for (let y = 0; y <= 4; y++) { g.beginPath(); g.moveTo(0, (y * h) / 4); g.lineTo(w, (y * h) / 4); g.stroke(); }
      g.strokeStyle = '#ff2b1c';
      g.lineWidth = 2 * devicePixelRatio;
      g.beginPath();
      // listening: the static thins, as if the squelch were closing on something
      const gain = trying.current ? 0.35 : 0.7;
      for (let x = 0; x <= w; x += 2) {
        const p = x / w;
        const y = locked.current
          ? Math.sin(p * Math.PI * 14 + t / 180) * 0.32 + Math.sin(p * Math.PI * 3 + t / 900) * 0.08
          : (Math.random() - 0.5) * gain * (0.6 + 0.4 * Math.sin(p * 40 + t / 60));
        g.lineTo(x, h / 2 + y * h * 0.8);
      }
      g.stroke();
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  const lock = async () => {
    if (state === 'trying' || state === 'yes') return;
    setState('trying');
    const r = await station<Result>('unlock', { lock: 'carrier', answer: String(f) });
    if (r.ok) { setState('yes'); onSolved(r); } else setState('no');
  };
  const nudge = (d: number) => { setF((v) => Math.min(400, Math.max(100, v + d))); setState('idle'); };

  return (
    <div className="st-game" role="dialog" aria-label="Receiver" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); lock(); } }}>
      <div className="st-game__head">
        <span>Receiver · forest band</span>
        <button type="button" onClick={onClose}>Close</button>
      </div>
      <canvas ref={scope} className="st-scope" aria-hidden="true" />
      <div className="st-dial">
        <button type="button" onClick={(e) => nudge(e.shiftKey ? -10 : -1)} aria-label="Down one kilohertz (ten with Shift)" title="−1 · Shift: −10">−</button>
        <input type="range" min={100} max={400} step={1} value={f} onChange={(e) => { setF(Number(e.target.value)); setState('idle'); }} aria-label="Frequency, kilohertz" />
        <button type="button" onClick={(e) => nudge(e.shiftKey ? 10 : 1)} aria-label="Up one kilohertz (ten with Shift)" title="+1 · Shift: +10">+</button>
        <output className="st-dial__f">{f} <small>kHz</small></output>
      </div>
      <div className="st-game__foot">
        <span className={`st-game__status st-game__status--${state}`}>
          {state === 'trying' ? 'listening…' : state === 'no' ? 'static.' : state === 'yes' ? 'carrier. voices. transcript.txt is open.' : 'the carrier never drifts · Enter locks'}
        </span>
        <button type="button" disabled={state === 'trying' || state === 'yes'} onClick={lock}>Lock</button>
      </div>
    </div>
  );
}
