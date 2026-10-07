'use client';

import { useEffect, useState } from 'react';
import { CHAPTERS } from '@/data/chapters';
import { useActiveChapter } from '@/lib/useActiveChapter';

const IDS = CHAPTERS.map((c) => c.id);

/**
 * The fixed interface: the wordmark line, the chapter navigation, the chapter
 * indicator and the index. It is the only thing that stays put, so it stays
 * out of the way: small, hairline, and recoloured to the chapter beneath it.
 */
export function Chrome() {
  const active = useActiveChapter(IDS);
  const [indexOpen, setIndexOpen] = useState(false);
  const current = CHAPTERS.find((c) => c.id === active) ?? CHAPTERS[0];
  const position = CHAPTERS.indexOf(current) + 1;

  // The chrome takes the tone of whatever chapter is on screen.
  useEffect(() => {
    document.body.dataset.tone = current.tone;
  }, [current.tone]);

  // Escape closes the index.
  useEffect(() => {
    if (!indexOpen) return;
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setIndexOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [indexOpen]);

  return (
    <>
      <header className="chrome">
        <a className="chrome__mark" href="#discovery">
          <span>RITUAL</span>
          <span className="chrome__sep">/</span>
          <span>2026</span>
        </a>

        <nav className="chrome__nav" aria-label="Chapters">
          {CHAPTERS.filter((c) => c.nav).map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className={c.id === active ? 'is-active' : undefined}
              aria-current={c.id === active ? 'location' : undefined}
            >
              {c.nav}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="chrome__index"
          aria-expanded={indexOpen}
          aria-controls="index-overlay"
          onClick={() => setIndexOpen((v) => !v)}
        >
          INDEX
        </button>
      </header>

      <div className="progress" aria-hidden="true">
        <span className="progress__num">{String(position).padStart(2, '0')}</span>
        <span className="progress__bar">
          {CHAPTERS.map((c, i) => (
            <span key={c.id} className={`progress__tick${i + 1 <= position ? ' is-passed' : ''}${c.id === active ? ' is-current' : ''}`} />
          ))}
        </span>
        <span className="progress__label">{current.label}</span>
      </div>

      {indexOpen ? (
        <div id="index-overlay" className="index" role="dialog" aria-label="Index">
          <button type="button" className="index__close" onClick={() => setIndexOpen(false)}>
            CLOSE
          </button>
          <ol className="index__list">
            {CHAPTERS.map((c, i) => (
              <li key={c.id}>
                <a href={`#${c.id}`} onClick={() => setIndexOpen(false)}>
                  <span className="index__num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="index__label">{c.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </>
  );
}
