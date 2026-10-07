'use client';

import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Result = 'idle' | 'wrong' | 'right';

/**
 * Sends a guess to the server and follows the answer. The page never knows
 * the answer; it only learns where to go when the server says it was right.
 */
function useSpeak(stage: number) {
  const router = useRouter();
  const [result, setResult] = useState<Result>('idle');
  const busy = useRef(false);

  const speak = useCallback(async (guess: string): Promise<boolean> => {
    if (busy.current || guess.trim().length < 2) return false;
    busy.current = true;
    try {
      const res = await fetch('/api/hunt', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ stage, guess }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (data.ok && typeof data.next === 'string') {
        setResult('right');
        window.setTimeout(() => router.push(data.next), 900);
        return true;
      }
      setResult('wrong');
      window.setTimeout(() => setResult('idle'), 900);
      return false;
    } catch {
      setResult('idle');
      return false;
    } finally {
      busy.current = false;
    }
  }, [stage, router]);

  return { speak, result };
}

/**
 * Typing anywhere on the page, outside a form field, writes a line at the
 * foot of the screen. It is spoken after a pause, or on Enter. Escape clears it.
 */
export function Incantation({ stage }: { stage: number }) {
  const { speak, result } = useSpeak(stage);
  const [text, setText] = useState('');
  const current = useRef('');
  current.current = text;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'Escape') { setText(''); return; }
      if (e.key === 'Enter') { if (current.current) void speak(current.current); return; }
      if (e.key === 'Backspace') { setText((s) => s.slice(0, -1)); return; }
      if (e.key === ' ' && current.current) e.preventDefault();   // a space mid-word must not scroll the page
      if (e.key.length === 1 && /[\p{L}\p{N} '-]/u.test(e.key) && !(e.key === ' ' && !current.current)) {
        setText((s) => (s + e.key).slice(0, 40));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [speak]);

  // speak after a pause in the typing
  useEffect(() => {
    if (!text.trim() || result !== 'idle') return;
    const id = window.setTimeout(() => void speak(text), 1500);
    return () => window.clearTimeout(id);
  }, [text, result, speak]);

  // a wrong word cools and is gone
  useEffect(() => {
    if (result === 'wrong') {
      const id = window.setTimeout(() => setText(''), 850);
      return () => window.clearTimeout(id);
    }
  }, [result]);

  return (
    <p className={`incantation incantation--${result}${text ? ' is-shown' : ''}`} aria-live="polite">
      {text}
    </p>
  );
}

/** The same thing as a form field, for touch screens and for the rite pages. */
export function SpeakField({ stage, label = 'Speak' }: { stage: number; label?: string }) {
  const { speak, result } = useSpeak(stage);
  const [value, setValue] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await speak(value);
    if (!ok) setValue('');
  };

  return (
    <form className={`speak speak--${result}`} onSubmit={submit}>
      <label className="speak__label" htmlFor={`speak-${stage}`}>{label}</label>
      <input
        id={`speak-${stage}`}
        className="speak__input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={64}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
      />
    </form>
  );
}
