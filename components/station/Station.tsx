'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CLEARANCE, getSession, setSession, station } from './api';
import { Runes, Tune } from './Games';
import { Terminal, type TerminalHandle } from './Terminal';
import { Topo } from './Topo';

/*
 * Field Station 7: Dr. Halvorsen's terminal and the station's instruments.
 * Built to the taste skill's app-screen rules, style data-terminal (dark,
 * read in long sessions): cards darker than the ground, every figure in one
 * monospace face (City Light, the Nostromo terminal's), colour on data only.
 * The one hue is the station's red: the readings' bars, the trail, the seals
 * opened, and the 1px line that marks what is selected or next.
 *
 * The screen answers one question first: which seal is next, and where do I
 * read for it? The terminal, where it is answered, is the biggest block; the
 * title row names the next seal; the seal track beside it is the one element
 * only this product has.
 *
 * What moves, moves every frame and outside React: the bars by a transform,
 * the charts by attributes on their own nodes, the map by a transform on its
 * view. React is asked to render only when something is said or opened.
 */

// ------------------------------------------------------------------ data

/** The four seals, in order, and what each one opens. */
export const SEALS = [
  { id: 'stone', name: 'Stone', opens: 'journal_04.enc', clue: 'Read stone_07.txt and journal_02.txt, then the rune board.' },
  { id: 'date', name: 'Date', opens: 'anomaly_01.log', clue: 'journal_04.enc is open. Count the nights.' },
  { id: 'carrier', name: 'Carrier', opens: 'transcript.txt', clue: 'anomaly_01.log is open. Then the receiver.' },
  { id: 'admin', name: 'Director', opens: 'admin files', clue: 'transcript.txt is open. Read it down its edge.' },
] as const;

type Me = { name: string; level: number; solves?: Record<string, string> };

/** the station clock: stuck in its last winter, 41 minutes slow. Its own element, so the second hand moves nothing else. */
function Clock() {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const d = new Date(t);
  return <>19 Dec 1987 02:{String(14 + (d.getMinutes() % 40)).padStart(2, '0')}:{String(d.getSeconds()).padStart(2, '0')}</>;
}

type Wave = (t: number) => number;

/** a reading that wanders smoothly: a base and a few slow sines */
const wave = (base: number, ...terms: [number, number, number][]): Wave => (t) =>
  terms.reduce((v, [amp, freq, phase]) => v + amp * Math.sin(freq * t + phase), base);

/** `frame(t)` every animation frame, `tick(t)` a few times a second for the figures; still under reduced motion */
function useFrames(frame: (t: number) => void, tick?: (t: number) => void, every = 0.25) {
  const f = useRef(frame), k = useRef(tick);
  f.current = frame; k.current = tick;
  useEffect(() => {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    let raf = 0, last = -1;
    const loop = (now: number) => {
      const t = (now - t0) / 1000 + 40;
      f.current(t);
      if (t - last >= every) { last = t; k.current?.(t); }
      if (!still) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [every]);
}

/** the instruments, each with its range so its bar is the true ratio */
const READINGS = [
  { label: 'Magnetometer A', unit: '%', min: 0, max: 100, digits: 0, fn: wave(76, [9, 0.13, 0], [4, 0.41, 2], [1.5, 1.3, 1]) },
  { label: 'EM field', unit: 'µT', min: 0, max: 60, digits: 1, fn: wave(33, [8, 0.19, 1], [3, 0.67, 0], [1, 2.1, 3]) },
  { label: 'Ground', unit: '°C', min: -40, max: 0, digits: 1, fn: wave(-9, [0.8, 0.07, 0], [0.3, 0.5, 1]) },
  { label: 'Ring interior', unit: '°C', min: -40, max: 0, digits: 1, fn: wave(-31, [1.4, 0.11, 2], [0.5, 0.7, 0]) },
] as const;
const CARRIER = wave(14, [7, 0.23, 0], [4, 0.9, 1], [2, 2.7, 2]);
const LOCKED = wave(97, [0.8, 0.5, 0]);

// ---------------------------------------------------------------- blocks

/** one reading: label, figure with its unit, and a 2px bar at the true ratio (moved by a transform: no layout) */
function Reading({ label, unit, min, max, digits, fn }: { label: string; unit: string; min: number; max: number; digits: number; fn: Wave }) {
  const fill = useRef<HTMLElement>(null);
  const [shown, setShown] = useState('');
  useFrames(
    (t) => { if (fill.current) fill.current.style.transform = `scaleX(${Math.max(0, Math.min(1, (fn(t) - min) / (max - min))).toFixed(4)})`; },
    (t) => setShown(fn(t).toFixed(digits)),
  );
  return (
    <div className="st-reading">
      <span className="st-label">{label}</span>
      <span className="st-figure">{shown}<small>{unit}</small></span>
      <span className="st-meter"><i ref={fill} /></span>
    </div>
  );
}

/** the four seals as a track: opened ones with their time, the next one marked. Each row is a button: the clue, or the file it opened, in the terminal. */
function SealTrack({ level, solves, onPick }: { level: number; solves: Record<string, string>; onPick: (i: number) => void }) {
  return (
    <section className="st-card st-seals" aria-labelledby="st-seals-h">
      <header className="st-card__head"><h2 id="st-seals-h">Seals</h2><span className="st-meta">{level} of 4 open</span></header>
      <ol>
        {SEALS.map((s, i) => {
          const open = level > i, next = level === i;
          const at = solves[s.id];
          return (
            <li key={s.id} className={open ? 'is-open' : next ? 'is-next' : ''}>
              <button type="button" onClick={() => onPick(i)} title={open ? `read ${s.opens}` : next ? 'the clue, in the terminal' : 'sealed'} disabled={!open && !next}>
                <span className="st-seals__mark" aria-hidden="true" />
                <span className="st-seals__name">{s.name}<small>opens {s.opens}</small></span>
                <span className="st-seals__state">{open ? (at ? new Date(at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Open') : next ? 'Next' : '—'}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** the seven stones' surface temperatures, °C, against the forest's */
const STONES = [-27, -29, -33, -30, -28, -32, -35].map((b, i) => wave(b, [1.2, 0.17 + i * 0.03, i], [0.4, 0.8, i * 2]));

function StonesChart() {
  const bars = useRef<(SVGRectElement | null)[]>([]);
  const [label, setLabel] = useState('');
  // scale: 0 to -40 °C, ticks every 10, zero at the top (the bars hang down: colder is longer)
  const W = 360, H = 150, L = 34, T = 8, B = 22, y = (v: number) => T + (-v / 40) * (H - T - B);
  const bw = (W - L) / 7;
  useFrames(
    (t) => STONES.forEach((f, i) => bars.current[i]?.setAttribute('height', String(Math.max(0, y(f(t)) - y(0))))),
    (t) => setLabel(STONES.map((f) => f(t).toFixed(0)).join(', ')),
    1,
  );
  return (
    <section className="st-card st-chart" aria-labelledby="st-stones-h">
      <header className="st-card__head"><h2 id="st-stones-h">Ring stones</h2><span className="st-meta">surface, °C · dashed: forest −9</span></header>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Stone temperatures: ${label} °C`}>
        {[0, -10, -20, -30, -40].map((v) => (
          <g key={v}>
            <line x1={L} x2={W} y1={y(v)} y2={y(v)} className="st-grid" />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" className="st-tick">{v === 0 ? 0 : `−${-v}`}</text>
          </g>
        ))}
        {STONES.map((_, i) => (
          <g key={i}>
            <rect ref={(el) => { bars.current[i] = el; }} x={L + i * bw + bw * 0.28} y={y(0)} width={bw * 0.44} height={0} className={i === 6 ? 'st-col is-hue' : 'st-col'} />
            <text x={L + i * bw + bw / 2} y={H - 6} textAnchor="middle" className="st-tick">{i + 1}</text>
          </g>
        ))}
        <line x1={L} x2={W} y1={y(-9)} y2={y(-9)} className="st-ref" />
      </svg>
    </section>
  );
}

/** the seismic array: the mean ground velocity of its seven sensors over the last minute */
const SEIS = Array.from({ length: 7 }, (_, i) => wave(0, [1, 0.9 + i * 0.07, i], [0.45, 2.3 + i * 0.1, i * 2]));

function SeismicChart() {
  const path = useRef<SVGPathElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const clock = useRef(0);
  const [now, setNow] = useState('');
  const [hover, setHover] = useState<{ x: number; s: number } | null>(null);
  const W = 360, H = 150, L = 34, T = 8, B = 22, SPAN = 60, STEP = 0.5;
  const y = (v: number) => T + (1 - (v + 1.5) / 3) * (H - T - B);
  const x = (age: number) => W - (age / SPAN) * (W - L);   // age in seconds before now
  const mean = (s: number) => SEIS.reduce((a, f) => a + f(s), 0) / 7;
  useFrames((t) => {
    clock.current = t;
    if (!path.current) return;
    // samples sit on a fixed grid of moments, so the trace slides left as one piece instead of reshaping
    const last = Math.floor(t / STEP) * STEP, pts: string[] = [];
    for (let s = last - SPAN; s <= last; s += STEP) pts.push(`${Math.max(L, x(t - s)).toFixed(1)} ${y(mean(s)).toFixed(1)}`);
    pts.push(`${W} ${y(mean(t)).toFixed(1)}`);
    path.current.setAttribute('d', `M${pts.join('L')}`);
  }, (t) => {
    const v = mean(t);
    setNow(`${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`);
  }, 0.5);
  const fmt = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)} mm/s`;
  const onMove = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    const px = Math.min(W, Math.max(L, ((e.clientX - r.left) / r.width) * W));
    setHover({ x: px, s: clock.current - ((W - px) / (W - L)) * SPAN });
  };
  return (
    <section className="st-card st-chart" aria-labelledby="st-seis-h">
      <header className="st-card__head"><h2 id="st-seis-h">Seismic array</h2><span className="st-meta">mean of 7 · now {now} mm/s</span></header>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Seismic trace over the last minute, now ${now} mm/s`} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {[1.5, 0, -1.5].map((v) => (
          <g key={v}>
            <line x1={L} x2={W} y1={y(v)} y2={y(v)} className="st-grid" />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" className="st-tick">{v > 0 ? `+${v}` : v < 0 ? `−${-v}` : 0}</text>
          </g>
        ))}
        <path ref={path} className="st-line" />
        {hover ? (
          <g className="st-hover">
            <line x1={hover.x} x2={hover.x} y1={T} y2={H - B} />
            <circle cx={hover.x} cy={y(mean(hover.s))} r={4} />
            <text x={hover.x > W - 90 ? hover.x - 8 : hover.x + 8} y={T + 12} textAnchor={hover.x > W - 90 ? 'end' : 'start'}>
              {fmt(mean(hover.s))} · −{Math.round(clock.current - hover.s)} s
            </text>
          </g>
        ) : null}
        <text x={L} y={H - 6} className="st-tick">−60 s</text>
        <text x={W} y={H - 6} textAnchor="end" className="st-tick">now</text>
      </svg>
    </section>
  );
}

function Survey({ level, onNote, onExpand }: { level: number; onNote: (t: string) => void; onExpand: () => void }) {
  return (
    <section className="st-card st-survey" aria-labelledby="st-survey-h">
      <header className="st-card__head">
        <h2 id="st-survey-h">Survey</h2>
        <span className="st-card__tools">
          <span className="st-meta">1:12 500 · contours 10 m</span>
          <button type="button" className="st-btn st-btn--small" onClick={onExpand}>Expand</button>
        </span>
      </header>
      <Topo level={level} onNote={onNote} />
    </section>
  );
}

// ---------------------------------------------------------------- screen

export function Station() {
  // the instruments read the clock and drift: they start on screen, not on
  // the server. First the register is asked who this is; no session, the gate.
  const [me, setMe] = useState<Me | null | 'checking'>('checking');
  useEffect(() => {
    if (!getSession()) { setMe(null); return; }
    station<Me>('me').then((r) => setMe(r.error ? null : r));
  }, []);
  if (me === 'checking') return <main className="st" />;
  if (!me) return <Gate onIn={setMe} />;
  return <Wall me={me} onLogout={() => { setSession(''); setMe(null); }} />;
}

const NAME_KEY = 'svartskog-name';

/** The way in: any name, and the access code hidden on the main site. */
function Gate({ onIn }: { onIn: (me: Me) => void }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | string>('idle');
  useEffect(() => { try { setName(localStorage.getItem(NAME_KEY) ?? ''); } catch { /* a fresh register */ } }, []);
  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('busy');
    const r = await station<Me & { session: string }>('login', { name, code });
    if (r.error) return setState(r.error);
    setSession(r.session);
    try { localStorage.setItem(NAME_KEY, r.name); } catch { /* fine */ }
    onIn({ name: r.name, level: r.level, solves: r.solves });
  };
  return (
    <main className="st st-gatep">
      <form className="st-gate" onSubmit={go}>
        <p className="st-brand"><span className="st-brand__mark" aria-hidden="true">7</span>Field Station 7<span className="st-meta">Svartskog</span></p>
        <h1>Sign the register</h1>
        <p className="st-sub">Restricted terminal. Any name; the access code is on the site.</p>
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} maxLength={32} autoComplete="nickname" autoFocus required /></label>
        <label>Access code<input value={code} onChange={(e) => setCode(e.target.value)} type="password" autoComplete="off" required /></label>
        <button type="submit" className="st-btn st-btn--primary" disabled={state === 'busy'}>{state === 'busy' ? 'Checking' : 'Enter'}</button>
        <p className="st-gate__status" role="status">{state !== 'idle' && state !== 'busy' ? state : ''}</p>
        <Link href="/" className="st-link">Leave</Link>
      </form>
    </main>
  );
}

type Panel = null | 'runes' | 'tune' | 'map';

function Wall({ me, onLogout }: { me: Me; onLogout: () => void }) {
  const [level, setLevel] = useState(me.level);
  const [solves, setSolves] = useState<Record<string, string>>(me.solves ?? {});
  const [panel, setPanel] = useState<Panel>(null);
  const term = useRef<TerminalHandle | null>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  // a seal opened anywhere (the terminal, a game): its level, and its time on the track
  const onLevel = useCallback((l: number) => {
    setLevel((old) => {
      if (l > old) setSolves((s) => ({ ...s, [SEALS[l - 1].id]: new Date().toISOString() }));
      return l;
    });
  }, []);
  const bind = useCallback((h: TerminalHandle) => { term.current = h; }, []);
  const say = useCallback((t: string) => term.current?.say(t), []);
  const solved = useCallback((what: string) => (res: { level?: number }) => {
    if (typeof res.level === 'number') onLevel(res.level);
    term.current?.say(what, 'ok');
  }, [onLevel]);

  // a panel: opened from a button (focus comes back to it after), closed by Escape or the backdrop
  const open = useCallback((p: Exclude<Panel, null>) => {
    opener.current = document.activeElement as HTMLElement | null;
    setPanel(p);
  }, []);
  const close = useCallback(() => {
    setPanel(null);
    opener.current?.focus?.({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) close(); };
    document.addEventListener('keydown', onKey);
    // the first field in the panel takes the keyboard (the map itself, in its case), before any button
    const o = overlay.current;
    (o?.querySelector<HTMLElement>('input') ?? o?.querySelector<HTMLElement>('[tabindex="0"]') ?? o?.querySelector<HTMLElement>('button'))?.focus({ preventScroll: true });
    return () => document.removeEventListener('keydown', onKey);
  }, [panel, close]);

  const pickSeal = useCallback((i: number) => {
    const s = SEALS[i];
    if (level > i) term.current?.run(s.id === 'admin' ? 'ls' : `cat ${s.opens}`);
    else term.current?.say(`${s.name}: ${s.clue}`);
  }, [level]);

  const next = SEALS[level];
  return (
    <main className="st st-wall">
      <header className="st-top">
        <p className="st-brand"><span className="st-brand__mark" aria-hidden="true">7</span>Field Station 7<span className="st-meta">Svartskog · station clock <Clock /></span></p>
        <p className="st-top__right"><span>{me.name}</span><span className="st-meta">{CLEARANCE[level]}</span><Link href="/" className="st-link">Leave</Link></p>
      </header>

      <div className="st-title">
        <div>
          <h1>{next ? `Next seal: ${next.name}` : 'All four seals are open'}</h1>
          <p className="st-sub">{next ? next.clue : 'Read the director’s files: ls'}</p>
        </div>
        <div className="st-title__actions">
          <button type="button" className="st-btn" onClick={() => open('runes')}>Rune board</button>
          <button
            type="button"
            className="st-btn"
            onClick={() => open('tune')}
            disabled={level < 2}
            title={level < 2 ? 'Sealed until the date is found' : undefined}
          >
            Receiver{level < 2 ? <small> · sealed</small> : null}
          </button>
        </div>
      </div>

      <section className="st-readings" aria-label="Instruments">
        {READINGS.map((r) => <Reading key={r.label} {...r} />)}
        <Reading label="Carrier" unit="%" min={0} max={100} digits={0} fn={level >= 3 ? LOCKED : CARRIER} />
      </section>

      <div className="st-grid">
        <section className="st-card st-termp" aria-labelledby="st-term-h">
          <header className="st-card__head"><h2 id="st-term-h">Terminal</h2><span className="st-meta">{me.name} · {CLEARANCE[level]}</span></header>
          <Terminal level={level} name={me.name} bind={bind} onLevel={onLevel} onOpen={open} onLogout={onLogout} />
        </section>
        <SealTrack level={level} solves={solves} onPick={pickSeal} />
        <Survey level={level} onNote={say} onExpand={() => open('map')} />
        <div className="st-side">
          <StonesChart />
          <SeismicChart />
        </div>
      </div>

      {panel ? (
        <div ref={overlay} className="st-overlay" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          {panel === 'runes' ? <Runes onClose={close} onSolved={solved('the stone answers: journal_04.enc is open. cat journal_04.enc')} />
            : panel === 'tune' ? <Tune onClose={close} onSolved={solved('carrier locked. voices on the band. cat transcript.txt')} />
            : (
              <div className="st-game st-game--map" role="dialog" aria-label="Survey">
                <div className="st-game__head">
                  <span>Survey · 1:12 500 · contours 10 m</span>
                  <button type="button" onClick={close}>Close</button>
                </div>
                <Topo level={level} onNote={say} big />
              </div>
            )}
        </div>
      ) : null}
    </main>
  );
}
