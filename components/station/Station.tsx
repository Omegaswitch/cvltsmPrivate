'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CLEARANCE, getSession, setSession, station } from './api';
import { Runes, Tune } from './Games';
import { Terminal, type TerminalHandle } from './Terminal';
import { Topo } from './Topo';

/*
 * Field Station 7: the instrument wall of Dr. Halvorsen's station, laid out
 * like a car's track-mode screen, in one red. The instruments idle
 * and drift; the terminal is where the hunt is played; the two instruments
 * at the foot (the rune board, the receiver) open over it.
 *
 * Drawn sharp and flat, like a car's own screen: thin rules, solid red, no
 * glow, no boot, no flare. The type is the Nostromo terminal's (City Light).
 * The instruments move on smooth waves, every frame; their numbers change a
 * few times a second, so they can be read.
 */

function useClock() {
  // the station clock is stuck in its last winter, and runs 41 minutes slow
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const d = new Date(t);
  const m = d.getMinutes(), s = d.getSeconds();
  return { stamp: `Sat Dec 19 1987 · 02:${String(14 + (m % 40)).padStart(2, '0')}:${String(s).padStart(2, '0')}` };
}

type Wave = (t: number) => number;

/** a reading that wanders smoothly: a base and a few slow sines, never repeating quite the same way */
const wave = (base: number, ...terms: [number, number, number][]): Wave => (t) =>
  terms.reduce((v, [amp, freq, phase]) => v + amp * Math.sin(freq * t + phase), base);

/**
 * Runs `frame(t)` on every animation frame (seconds since mount) and, a few
 * times a second, `tick(t)` for the numbers. Once, standing still, under
 * reduced motion.
 */
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

function Bar({ label, unit, fn, pct, digits = 0 }: { label: string; unit?: string; fn: Wave; pct: (v: number) => number; digits?: number }) {
  const fill = useRef<HTMLElement>(null);
  const [shown, setShown] = useState('');
  useFrames(
    (t) => { if (fill.current) fill.current.style.width = `${Math.max(2, Math.min(100, pct(fn(t))))}%`; },
    (t) => setShown(fn(t).toFixed(digits)),
  );
  return (
    <section className="st-panel st-bar">
      <header><span>{label}</span><b>{shown}{unit}</b></header>
      <div className="st-bar__track"><i ref={fill} /></div>
    </section>
  );
}

/** the survey: a topographic map of the ground between the station and the ring */
function Survey({ level }: { level: number }) {
  return (
    <section className="st-panel st-survey">
      <header><span>Survey · Svartskog 1:12 500</span><span className="st-survey__elev">Contours 10 m</span></header>
      <Topo level={level} />
      <div className="st-survey__legs">
        <span>Station <b>172 m</b></span>
        <span>Trail <b>2.6 km</b></span>
        <span>Ring <b>412 m</b></span>
      </div>
    </section>
  );
}

/** magnetometer B: it will not point north. It wanders, and keeps swinging back into the ring */
const NEEDLE = wave(58, [22, 0.21, 0], [9, 0.53, 1.3], [4, 1.7, 0.4]);

function Compass() {
  const needle = useRef<HTMLElement>(null);
  useFrames((t) => { if (needle.current) needle.current.style.transform = `rotate(${NEEDLE(t)}deg)`; });
  return (
    <section className="st-panel st-compass">
      <header><span>Magnetometer B</span></header>
      <div className="st-compass__dial">
        <span className="n">N</span><span className="e">E</span><span className="s">S</span><span className="w">W</span>
        <i ref={needle} />
      </div>
      <p className="st-compass__note">points into the ring</p>
    </section>
  );
}

/** the seven sensors in the ring, each drifting on its own slow trace */
function Seismic() {
  const bars = useRef<(HTMLElement | null)[]>([]);
  useFrames((t) => bars.current.forEach((b, i) => {
    if (!b) return;
    b.style.height = `${42 + 22 * Math.sin(t * (0.19 + i * 0.03) + i * 1.7) + 9 * Math.sin(t * 0.53 + i)}%`;
  }));
  return (
    <section className="st-panel st-seis">
      <header><span>Seismic</span><span>1.06 s</span></header>
      <ol>{Array.from({ length: 7 }, (_, i) => <li key={i}><span>{i + 1}</span><i ref={(el) => { bars.current[i] = el; }} /></li>)}</ol>
    </section>
  );
}

const STONE_TEMPS = [-27, -29, -33, -30, -28, -32, -35].map((b, i) => wave(b, [1.2, 0.17 + i * 0.03, i], [0.4, 0.8, i * 2]));

function Ring() {
  const [temps, setTemps] = useState<number[]>([]);
  useFrames(() => {}, (t) => setTemps(STONE_TEMPS.map((f) => Math.round(f(t)))), 0.6);
  return (
    <section className="st-panel st-ringp">
      <header><span>Stones</span><span>°C</span></header>
      <div className="st-ringp__body">
        {temps.map((t, i) => {
          const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
          return (
            <span key={i} style={{ left: `${50 + Math.cos(a) * 36}%`, top: `${50 + Math.sin(a) * 36}%` }}>
              <i />{t}°
            </span>
          );
        })}
        <b className="st-ringp__core">-31°</b>
      </div>
    </section>
  );
}

const MAG = wave(76, [9, 0.13, 0], [4, 0.41, 2], [1.5, 1.3, 1]);
const EM = wave(33, [8, 0.19, 1], [3, 0.67, 0], [1, 2.1, 3]);
const GROUND = wave(-9, [0.8, 0.07, 0], [0.3, 0.5, 1]);
const RING_T = wave(-31, [1.4, 0.11, 2], [0.5, 0.7, 0]);
const CARRIER = wave(14, [7, 0.23, 0], [4, 0.9, 1], [2, 2.7, 2]);
const LOCKED = wave(97, [0.8, 0.5, 0]);

type Me = { name: string; level: number };

export function Station() {
  // the instruments read the clock and drift: they start on screen, not on the
  // server. First the register is asked who this is; no session, the gate.
  const [me, setMe] = useState<Me | null | 'checking'>('checking');
  useEffect(() => {
    if (!getSession()) { setMe(null); return; }
    station<Me>('me').then((r) => setMe(r.error ? null : r));
  }, []);
  if (me === 'checking') return <main className="st" />;
  if (!me) return <Gate onIn={setMe} />;
  return <Wall me={me} onLogout={() => { setSession(''); setMe(null); }} />;
}

/**
 * The way in: any name, and the station's access code, which is hidden on
 * the main site. The name is how the register knows them.
 */
function Gate({ onIn }: { onIn: (me: Me) => void }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | string>('idle');
  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('busy');
    const r = await station<Me & { session: string }>('login', { name, code });
    if (r.error) return setState(r.error);
    setSession(r.session);
    onIn({ name: r.name, level: r.level });
  };
  return (
    <main className="st st-gatep">
      <form className="st-gate" onSubmit={go}>
        <p className="st-gate__head">FIELD STATION 7 / SVARTSKOG</p>
        <p className="st-gate__note">Restricted terminal. Sign the register to enter.</p>
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} maxLength={32} autoComplete="nickname" autoFocus required /></label>
        <label>Access code<input value={code} onChange={(e) => setCode(e.target.value)} type="password" autoComplete="off" required /></label>
        <button type="submit" disabled={state === 'busy'}>{state === 'busy' ? 'Checking…' : 'Enter'}</button>
        <p className="st-gate__status" role="status">{state !== 'idle' && state !== 'busy' ? state : ''}</p>
        <Link href="/" className="st-gate__leave">Leave</Link>
      </form>
    </main>
  );
}

function Wall({ me, onLogout }: { me: Me; onLogout: () => void }) {
  const [level, setLevel] = useState(me.level);
  const [game, setGame] = useState<null | 'runes' | 'tune'>(null);
  const term = useRef<TerminalHandle | null>(null);
  const clock = useClock();

  const bind = useCallback((h: TerminalHandle) => { term.current = h; }, []);
  const solved = useCallback((what: string) => (res: { level?: number }) => {
    if (typeof res.level === 'number') setLevel(res.level);
    term.current?.say(what, 'ok');
  }, []);

  return (
    <main className="st">
      <div>
        <header className="st-top">
          <span>STN 7 · <span className="st-batt" aria-label="generator 86%">▮▮▮▮▮▮▮▮▯▯</span> 86%</span>
          <span>OBS 212 / 365 · RING 7 · {CLEARANCE[level]}</span>
          <span>{clock.stamp}</span>
        </header>

        <div className="st-grid">
          <div className="st-col">
            <Bar label="Magnetometer A" unit="%" fn={MAG} pct={(v) => v} />
            <Bar label="EM field" unit=" µT" fn={EM} pct={(v) => v * 1.6} />
            <Bar label="Ground temp" unit="°C" fn={GROUND} pct={(v) => 40 + v} digits={1} />
            <Bar label="Ring temp" unit="°C" fn={RING_T} pct={(v) => 40 + v} digits={1} />
            <Ring />
          </div>
          <div className="st-col">
            <Bar label="Carrier" unit="%" fn={level >= 3 ? LOCKED : CARRIER} pct={(v) => v} />
            <Compass />
            <Seismic />
          </div>
          <div className="st-col st-col--wide">
            <Survey level={level} />
            <section className="st-panel st-termp">
              <header><span>Terminal</span><span>{me.name} / {CLEARANCE[level]}</span></header>
              <Terminal level={level} name={me.name} bind={bind} onLevel={setLevel} onOpen={setGame} onLogout={onLogout} />
            </section>
          </div>
          <div className="st-col">
            <section className="st-panel st-status">
              <header><span>Ring</span><b>{level >= 1 ? 'Open' : 'Unknown'}</b></header>
              <dl>
                <div><dt>Figures</dt><dd>7 · 9</dd></div>
                <div><dt>Frost</dt><dd>Present</dd></div>
                <div><dt>Station clock</dt><dd>−41 min</dd></div>
                <div><dt>Cameras</dt><dd>2 of 3</dd></div>
                <div><dt>Wolf-coats</dt><dd>{level >= 1 ? 'Ulfhednar' : 'Unnamed'}</dd></div>
              </dl>
            </section>
            <section className="st-panel st-split">
              <header><span>Clearance</span></header>
              <div><b>{CLEARANCE[level]}</b><span>{level} / 4</span></div>
              <div className="st-bar__track"><i style={{ width: `${(level / 4) * 100}%` }} /></div>
            </section>
            <section className="st-panel st-split">
              <header><span>Seals</span></header>
              <div><span>Stone</span><span>Date</span><span>Carrier</span><span>Director</span></div>
              <div>{[1, 2, 3, 4].map((l) => <b key={l}>{level >= l ? 'Open' : 'Sealed'}</b>)}</div>
            </section>
            <section className="st-panel st-toggles">
              <div><span>Radio</span><b>{level >= 3 ? 'ON' : 'OFF'}</b></div>
              <div><span>Generator</span><b>ON</b></div>
            </section>
          </div>
        </div>

        <footer className="st-foot">
          <button type="button" onClick={() => setGame('runes')}>Rune board</button>
          <button type="button" className="st-foot__bar" onClick={() => (level >= 2 ? setGame('tune') : term.current?.say('receiver: sealed. the carrier is in anomaly_01.log.', 'err'))}>
            <span>Receiver · {level >= 3 ? '203' : '———'} kHz</span>
            <span>{level >= 2 ? 'Ready' : 'Sealed'}</span>
          </button>
          <Link href="/">Leave station</Link>
        </footer>

        {game ? (
          <div className="st-overlay" onClick={(e) => { if (e.target === e.currentTarget) setGame(null); }}>
            {game === 'runes'
              ? <Runes onClose={() => setGame(null)} onSolved={solved('the stone answers: journal_04.enc is open. cat journal_04.enc')} />
              : <Tune onClose={() => setGame(null)} onSolved={solved('carrier locked. voices on the band. cat transcript.txt')} />}
          </div>
        ) : null}
      </div>
    </main>
  );
}
