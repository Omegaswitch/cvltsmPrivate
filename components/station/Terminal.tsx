'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CLEARANCE, SEALED, station, type Listing } from './api';

/*
 * The station's terminal. Everything a visitor reads comes from the server
 * (app/api/station): this side only prints it, a block at a time, each one
 * coming in with a short fade (.st-term__block in station.css).
 *
 * It can open the two instruments (onOpen: 'runes' or 'tune') and hears back
 * from them through `say`, so a key found in a game is answered here; `run`
 * lets the rest of the wall type a command (a seal on the track: its file).
 *
 * The listing is kept once it has been read, so Tab completes file names as
 * well as commands, and a file in a listing is a button that reads it.
 */

type Block = { id: number; text: string; kind: 'out' | 'in' | 'err' | 'ok' | 'ls'; files?: Listing };

const COMMANDS = ['help', 'ls', 'cat', 'decrypt', 'runes', 'tune', 'login', 'hint', 'whoami', 'clear', 'ask', 'logout'];

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
  ask <question>         ask the archive (it holds no keys)
  logout                 sign out (your progress stays in the register)

  Tab completes a command or a file name; up and down recall what you typed.
  A file name in a listing can be clicked.`;

const HISTORY_KEY = 'svartskog-history';

export type TerminalHandle = { say: (text: string, kind?: Block['kind']) => void; run: (line: string) => void };

export function Terminal({
  level,
  name,
  onOpen,
  onLevel,
  onLogout,
  bind,
}: {
  level: number;
  name: string;
  onLogout: () => void;
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
  const files = useRef<Listing>([]);
  const id = useRef(0);
  const field = useRef<HTMLInputElement>(null);
  const screen = useRef<HTMLDivElement>(null);

  const say = useCallback((text: string, kind: Block['kind'] = 'out', extra: Partial<Block> = {}) => {
    setBlocks((b) => [...b.slice(-60), { id: ++id.current, text, kind, ...extra }]);
  }, []);

  const setLevel = onLevel;

  useEffect(() => {
    say(`FIELD STATION 7 / SVARTSKOG\nsigned in: ${name}. clearance: ${CLEARANCE[level]}.\ntype help, or start with: cat readme.txt`);
    try { setHistory(JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '[]')); } catch { /* fresh */ }
    // the listing, quietly, so Tab can complete file names from the start
    station<{ files: Listing }>('ls').then((r) => { if (r.files) files.current = r.files; });
    // a keyboard is at hand: the line takes it. Not on a phone, where that would raise the keyboard over the page.
    if (matchMedia('(pointer: fine)').matches) field.current?.focus({ preventScroll: true });
    // once, on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = screen.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [blocks]);

  const prompt = asking ? 'password:' : `${level >= 4 ? 'asgeir' : 'guest'}@stn7:~$`;

  const unlocked = useCallback((r: { ok?: boolean; level?: number; files?: Listing }) => {
    if (typeof r.level === 'number') setLevel(r.level);
    if (r.files) files.current = r.files;
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
        files.current = r.files;
        return say(r.files.map((f) => `${f.locked ? '[sealed] ' : '         '}${f.name}`).join('\n'), 'ls', { files: r.files });
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
        const r = await station<{ ok: boolean; level: number; files?: Listing }>('unlock', { lock, answer: key.join(' ') });
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
      case 'ask': {
        const question = args.join(' ');
        if (!question) return say('usage: ask <question>', 'err');
        say('archive: searching...');
        const r = await station<{ reply: string }>('ask', { question });
        return r.error ? say(`archive: ${r.error}`, 'err') : say(`ARCHIVE > ${r.reply}`);
      }
      case 'logout':
        say('signing out.');
        return onLogout();
      default:
        return say(`${c}: not understood. type help`, 'err');
    }
  }, [level, onOpen, onLogout, say, unlocked]);

  // a command as if typed: the buttons under the screen, a file name in a listing, a seal on the track
  const type = useCallback(async (cmd: string) => {
    if (busy || asking) return;
    if (cmd === 'ask ') { setInput('ask '); field.current?.focus(); return; }
    say(`${prompt} ${cmd}`, 'in');
    setBusy(true);
    await run(cmd);
    setBusy(false);
    // whatever was pressed, the line is where the keyboard goes next (not on a phone: the keyboard would rise)
    if (matchMedia('(pointer: fine)').matches) field.current?.focus({ preventScroll: true });
  }, [asking, busy, prompt, run, say]);

  useEffect(() => { bind({ say, run: type }); }, [bind, say, type]);

  const remember = (line: string) => {
    setHistory((h) => {
      const next = [...h.filter((x) => x !== line), line].slice(-40);
      try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* fine */ }
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const line = input;
    setInput('');
    if (asking) {
      say(`${prompt} ${'*'.repeat(line.length)}`, 'in');
      setBusy(true);
      const r = await station<{ ok: boolean; level: number; files?: Listing }>('unlock', { lock: 'admin', user: asking.user, answer: line });
      setAsking(null);
      setBusy(false);
      if (!r.ok) return say('login incorrect.', 'err');
      unlocked(r);
      return say(`welcome back, director.\nclearance ${CLEARANCE[4]}. new files: ls`, 'ok');
    }
    say(`${prompt} ${line}`, 'in');
    if (line.trim()) remember(line);
    setHi(-1);
    setBusy(true);
    await run(line);
    setBusy(false);
  };

  /** Tab: complete the word at the end of the line, a command first, a file name after one */
  const complete = () => {
    const words = input.split(/\s+/);
    const last = words[words.length - 1] ?? '';
    const pool = words.length <= 1 ? COMMANDS : files.current.map((f) => f.name);
    const hits = pool.filter((w) => w.startsWith(last) && w !== last);
    if (!hits.length) return;
    // the longest common start of all the hits; one hit gets a space after it
    let common = hits[0];
    for (const h of hits) { let i = 0; while (i < common.length && common[i] === h[i]) i++; common = common.slice(0, i); }
    words[words.length - 1] = common;
    setInput(words.join(' ') + (hits.length === 1 ? ' ' : ''));
    if (hits.length > 1 && common === last) say(hits.join('   '));
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && !asking) { e.preventDefault(); complete(); return; }
    if (e.key === 'Escape') { e.preventDefault(); setInput(''); setHi(-1); return; }
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

  return (
    <div className="st-term" onClick={() => field.current?.focus({ preventScroll: true })}>
      <div className="st-term__screen" ref={screen} aria-live="polite">
        {blocks.map((b) => (
          b.kind === 'ls' && b.files ? (
            <pre key={b.id} className="st-term__block st-term__block--ls">
              {b.files.map((f) => (
                <span key={f.name} className="st-term__file">
                  {f.locked ? '[sealed] ' : '         '}
                  <button type="button" onClick={(e) => { e.stopPropagation(); type(`cat ${f.name}`); }} title={f.locked ? 'sealed: decrypt it with its key' : `cat ${f.name}`}>{f.name}</button>
                </span>
              ))}
            </pre>
          ) : (
            <pre key={b.id} className={`st-term__block st-term__block--${b.kind}`}>
              {b.text}
            </pre>
          )
        ))}
      </div>
      <div className="st-term__keys">
        {[['Help', 'help'], ['Files', 'ls'], ['Hint', 'hint'], ['Runes', 'runes'], ['Receiver', 'tune'], ['Ask the archive', 'ask '], ['Clear', 'clear']].map(([label, cmd]) => (
          <button key={cmd} type="button" onClick={(e) => { e.stopPropagation(); type(cmd); }} disabled={busy}>{label}</button>
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
          enterKeyHint="send"
        />
      </form>
    </div>
  );
}
