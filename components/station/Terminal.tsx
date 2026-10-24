'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import BeamText from './BeamText';
import { CLEARANCE, SEALED, getPass, levelOfPass, setPass, station, type Listing } from './api';

/*
 * The station's terminal. Everything a visitor reads comes from the server
 * (app/api/station): this side only prints it, a block at a time, written by
 * the beam the way the Nostromo terminal writes. Older blocks stand still.
 *
 * It can open the two instruments (onOpen: 'runes' or 'tune') and hears back
 * from them through `say`, so a key found in a game is answered here.
 */

type Block = { id: number; text: string; kind: 'out' | 'in' | 'err' | 'ok' };

const HELP = `commands
  ls                     list files
  cat <file>             read a file
  decrypt <file> <key>   open a sealed file
  runes                  the rune board (stone 7)
  tune                   the receiver
  login <name>           sign in to an account
  hint                   a nudge
  whoami                 your clearance
  clear                  clear the screen
  logout                 back to guest (forgets your progress)`;

export type TerminalHandle = { say: (text: string, kind?: Block['kind']) => void };

export function Terminal({
  level,
  onOpen,
  onLevel,
  bind,
}: {
  level: number;
  onOpen: (game: 'runes' | 'tune') => void;
  onLevel: (level: number) => void;
  bind: (h: TerminalHandle) => void;
}) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState<null | { user: string }>(null);   // a password prompt
  const [history, setHistory] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const id = useRef(0);
  const field = useRef<HTMLInputElement>(null);
  const screen = useRef<HTMLDivElement>(null);

  const say = useCallback((text: string, kind: Block['kind'] = 'out') => {
    setBlocks((b) => [...b.slice(-60), { id: ++id.current, text, kind }]);
  }, []);

  const setLevel = onLevel;

  useEffect(() => { bind({ say }); }, [bind, say]);

  useEffect(() => {
    const l = levelOfPass(getPass());
    setLevel(l);
    say(`FIELD STATION 7 / SVARTSKOG\nconnection open. clearance: ${CLEARANCE[l]}.\ntype help, or start with: cat readme.txt`);
  }, [say, setLevel]);

  useEffect(() => {
    screen.current?.scrollTo({ top: screen.current.scrollHeight });
  }, [blocks]);

  const prompt = asking ? 'password:' : `${level >= 4 ? 'asgeir' : 'guest'}@stn7:~$`;

  const unlocked = useCallback((r: { ok?: boolean; level?: number; pass?: string }) => {
    if (r.pass) setPass(r.pass);
    if (typeof r.level === 'number') setLevel(r.level);
  }, [setLevel]);

  const run = useCallback(async (line: string) => {
    const [cmd = '', ...args] = line.trim().split(/\s+/);
    const c = cmd.toLowerCase();
    switch (c) {
      case '':
        return;
      case 'help':
        return say(HELP);
      case 'clear':
        return setBlocks([]);
      case 'whoami':
        return say(`clearance: ${CLEARANCE[level]} (${level}/4)`);
      case 'ls': {
        const r = await station<{ files: Listing }>('ls');
        if (r.error) return say(r.error, 'err');
        return say(r.files.map((f) => `${f.locked ? '[sealed] ' : '         '}${f.name}`).join('\n'));
      }
      case 'cat':
      case 'open':
      case 'read': {
        if (!args[0]) return say('usage: cat <file>', 'err');
        const r = await station<{ body: string; lock?: string }>('cat', { name: args[0] });
        if (r.error === 'sealed') return say(`${args[0]} is sealed. try: decrypt ${args[0]} <key>`, 'err');
        if (r.error) return say(`${args[0]}: ${r.error}`, 'err');
        return say(r.body);
      }
      case 'decrypt': {
        const [file, ...key] = args;
        const lock = SEALED[file ?? ''];
        if (!file || !key.length) return say('usage: decrypt <file> <key>', 'err');
        if (!lock) return say(`${file}: not sealed`, 'err');
        say('decrypting...');
        const r = await station<{ ok: boolean; level: number; pass: string }>('unlock', { lock, answer: key.join(' ') });
        if (r.error === 'not yet') return say(`${file}: a key from an earlier seal is missing.`, 'err');
        if (!r.ok) return say('key rejected.', 'err');
        unlocked(r);
        say(`${file}: open. clearance ${CLEARANCE[r.level]}.`, 'ok');
        const f = await station<{ body: string }>('cat', { name: file });
        if (f.body) say(f.body);
        return;
      }
      case 'login': {
        if (!args[0]) return say('usage: login <name>', 'err');
        if (level < 3) return say('login: the director\'s account answers only on the carrier. find it first.', 'err');
        setAsking({ user: args[0] });
        return;
      }
      case 'runes':
        onOpen('runes');
        return say('rune board open.');
      case 'tune':
        if (level < 2) return say('receiver: sealed. the carrier is in anomaly_01.log.', 'err');
        onOpen('tune');
        return say('receiver on.');
      case 'hint': {
        const r = await station<{ hint: string }>('hint');
        return say(r.hint ?? r.error ?? '');
      }
      case 'logout':
        setPass('');
        setLevel(0);
        return say('pass cleared. clearance: GUEST.');
      default:
        return say(`${c}: not understood. type help`, 'err');
    }
  }, [level, onOpen, say, unlocked, setLevel]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const line = input;
    setInput('');
    if (asking) {
      say(`${prompt} ${'*'.repeat(line.length)}`, 'in');
      setBusy(true);
      const r = await station<{ ok: boolean; level: number; pass: string }>('unlock', { lock: 'admin', user: asking.user, answer: line });
      setAsking(null);
      setBusy(false);
      if (!r.ok) return say('login incorrect.', 'err');
      unlocked(r);
      return say(`welcome back, director.\nclearance ${CLEARANCE[4]}. new files: ls admin`, 'ok');
    }
    say(`${prompt} ${line}`, 'in');
    if (line.trim()) setHistory((h) => [...h, line].slice(-40));
    setHi(-1);
    setBusy(true);
    await run(line);
    setBusy(false);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (asking || !history.length) return;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const i = hi < 0 ? history.length - 1 : Math.max(0, hi - 1);
      setHi(i); setInput(history[i]);
    } else if (e.key === 'ArrowDown' && hi >= 0) {
      e.preventDefault();
      const i = hi + 1;
      if (i >= history.length) { setHi(-1); setInput(''); } else { setHi(i); setInput(history[i]); }
    }
  };

  const last = blocks.at(-1)?.id;
  return (
    <div className="st-term" onClick={() => field.current?.focus({ preventScroll: true })}>
      <div className="st-term__screen" ref={screen} aria-live="polite">
        {blocks.map((b) => (
          <pre key={b.id} className={`st-term__block st-term__block--${b.kind}`}>
            {b.id === last && b.kind !== 'in' ? <BeamText text={b.text} rate={Math.max(90, b.text.length * 1.4)} /> : b.text}
          </pre>
        ))}
      </div>
      <form className="st-term__line" onSubmit={submit}>
        <label htmlFor="st-cmd" className="st-term__prompt">{prompt}</label>
        <input
          id="st-cmd"
          ref={field}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          type={asking ? 'password' : 'text'}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={busy}
          className="st-term__input"
        />
      </form>
    </div>
  );
}
