'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CLEARANCE } from './api';
import { Runes, Tune } from './Games';
import { Terminal, type TerminalHandle } from './Terminal';

/*
 * Field Station 7: the instrument wall of Dr. Halvorsen's station, laid out
 * like a car's track-mode screen, in one red phosphor. The instruments idle
 * and drift; the terminal is where the hunt is played; the two instruments
 * at the foot (the rune board, the receiver) open over it.
 *
 * The tube is the SWS Nostromo one, in red: scanlines through every glyph,
 * a band rolling down, a flicker, a flare now and then, the vertical hold
 * slipping, and a cold power-on.
 */

const r = (a: number, b: number) => a + Math.random() * (b - a);

function useClock() {
  // the station clock is stuck in its last winter, and runs 41 minutes slow
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const d = new Date(t);
  const m = d.getMinutes(), s = d.getSeconds();
  return { stamp: `Sat Dec 19 1987 · 02:${String(14 + (m % 40)).padStart(2, '0')}:${String(s).padStart(2, '0')}`, s };
}

function useDrift() {
  const [v, setV] = useState({ mag: 72, em: 31, ground: -9, ring: -31, sig: 12, needle: 0, seis: [4, 2, 6, 3, 5, 2, 7] });
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setV((o) => ({
      mag: Math.round(Math.min(99, Math.max(60, o.mag + r(-3, 3)))),
      em: Math.round(Math.min(60, Math.max(18, o.em + r(-4, 4)))),
      ground: Math.round(o.ground + r(-0.6, 0.6) * 10) / 10 || -9,
      ring: Math.round((-31 + r(-1.5, 1.5)) * 10) / 10,
      sig: Math.round(Math.min(40, Math.max(4, o.sig + r(-5, 5)))),
      needle: o.needle + r(-14, 14),
      seis: o.seis.map((x) => Math.round(Math.min(9, Math.max(1, x + r(-2, 2))))),
    })), 900);
    return () => clearInterval(id);
  }, []);
  return v;
}

function Bar({ label, value, unit, pct }: { label: string; value: string; unit?: string; pct: number }) {
  return (
    <section className="st-panel st-bar">
      <header><span>{label}</span><b>{value}{unit}</b></header>
      <div className="st-bar__track"><i style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} /></div>
    </section>
  );
}

/** the survey: the trail from the station to the ring, glowing, and where you are */
function Survey({ level }: { level: number }) {
  const stones = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
    return [520 + Math.cos(a) * 34, 250 + Math.sin(a) * 34];
  });
  return (
    <section className="st-panel st-survey">
      <header><span>Survey</span><span className="st-survey__elev">Elevation<br /><b>412 m</b></span></header>
      <svg viewBox="0 0 760 380" className="st-map" aria-label="Survey map: the trail from the station to the ring of seven stones">
        <path className="st-map__ghost" d="M40 330 C120 300 150 250 210 240 S300 260 330 210 S420 120 470 160 S560 300 520 250" />
        <path className="st-map__trail" d="M40 330 C120 300 150 250 210 240 S300 260 330 210 S420 120 470 160 S560 300 520 250" />
        <path className="st-map__ridge" d="M300 40 C380 70 440 30 520 60 S660 90 720 60" />
        <circle cx="520" cy="250" r="54" className="st-map__ring" />
        {stones.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 6 ? 6 : 4} className={`st-map__stone${i === 6 ? ' is-seven' : ''}`} />)}
        <rect x="28" y="318" width="22" height="22" className="st-map__cabin" />
        <text x="58" y="352" className="st-map__label">STN 7</text>
        <text x="592" y="256" className="st-map__label">RING</text>
        <path d="M466 168 l-10 26 10 -7 10 7 z" className="st-map__you" />
      </svg>
      <div className="st-survey__legs">
        <span>S1 <b>2.1 km</b></span>
        <span>S2 <b>{level >= 2 ? '0.4 km' : '—'}</b></span>
        <span>S3 <b>{level >= 3 ? 'ring' : '—'}</b></span>
      </div>
    </section>
  );
}

function Compass({ needle }: { needle: number }) {
  return (
    <section className="st-panel st-compass">
      <header><span>Magnetometer B</span></header>
      <div className="st-compass__dial">
        <span className="n">N</span><span className="e">E</span><span className="s">S</span><span className="w">W</span>
        <i style={{ transform: `rotate(${needle}deg)` }} />
      </div>
      <p className="st-compass__note">points into the ring</p>
    </section>
  );
}

function Ring({ temps }: { temps: number[] }) {
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

export function Station() {
  // the instruments read the clock and drift at random: they start on screen,
  // not on the server, so the two never disagree
  const [on, setOn] = useState(false);
  useEffect(() => setOn(true), []);
  return on ? <Wall /> : <main className="st" />;
}

function Wall() {
  const [level, setLevel] = useState(0);
  const [game, setGame] = useState<null | 'runes' | 'tune'>(null);
  const [flare, setFlare] = useState(false);
  const term = useRef<TerminalHandle | null>(null);
  const clock = useClock();
  const v = useDrift();

  const bind = useCallback((h: TerminalHandle) => { term.current = h; }, []);
  const solved = useCallback((what: string) => (res: { level?: number }) => {
    if (typeof res.level === 'number') setLevel(res.level);
    term.current?.say(what, 'ok');
  }, []);

  // now and then the phosphor surges
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let t = 0;
    const next = () => { t = window.setTimeout(() => { setFlare(true); t = window.setTimeout(() => { setFlare(false); next(); }, 460); }, r(3500, 11000)); };
    next();
    return () => clearTimeout(t);
  }, []);

  const temps = [-27, -29, -33, -30, -28, -32, -35].map((t, i) => Math.round(t + Math.sin(clock.s / 3 + i) * 1.4));

  return (
    <main className="st crt-glow">
      <div aria-hidden className="st-crt" />
      <div aria-hidden className="st-power" />
      <div className={`st-hold${flare ? ' st-flare' : ''}`}>
        <div aria-hidden className="st-grain" />
        <header className="st-top">
          <span>STN 7 · <span className="st-batt" aria-label="generator 86%">▮▮▮▮▮▮▮▮▯▯</span> 86%</span>
          <span>OBS 212 / 365 · RING 7 · {CLEARANCE[level]}</span>
          <span>{clock.stamp}</span>
        </header>

        <div className="st-grid">
          <div className="st-col">
            <Bar label="Magnetometer A" value={`${v.mag}`} unit="%" pct={v.mag} />
            <Bar label="EM field" value={`${v.em}`} unit=" µT" pct={v.em * 1.6} />
            <Bar label="Ground temp" value={`${v.ground}`} unit="°C" pct={40 + v.ground} />
            <Bar label="Ring temp" value={`${v.ring}`} unit="°C" pct={40 + v.ring} />
            <Ring temps={temps} />
          </div>
          <div className="st-col">
            <Bar label="Carrier" value={`${level >= 3 ? 98 : v.sig}`} unit="%" pct={level >= 3 ? 98 : v.sig} />
            <Compass needle={v.needle} />
            <section className="st-panel st-seis">
              <header><span>Seismic</span><span>1.06 s</span></header>
              <ol>{v.seis.map((s, i) => <li key={i}><span>{i + 1}</span><i style={{ height: `${s * 10}%` }} /></li>)}</ol>
            </section>
          </div>
          <div className="st-col st-col--wide">
            <Survey level={level} />
            <section className="st-panel st-termp">
              <header><span>Terminal</span><span>{level >= 4 ? 'asgeir' : 'guest'}@stn7 · {CLEARANCE[level]}</span></header>
              <Terminal level={level} bind={bind} onLevel={setLevel} onOpen={setGame} />
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
