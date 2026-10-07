'use client';

import { useState } from 'react';
import { RUNES } from '@/data/runes';
import { KEYCAPS } from '@/data/keycaps';
import { Plate } from './Plate';
import { RuneSpecimen } from './RuneSpecimen';

/**
 * Chapter 04. The Elder Futhark as a typographic index on black. Hovering a
 * rune dims the rest, enlarges it, and reveals its metadata and keycap plate.
 * Clicking opens the specimen.
 */
export function SigilsSection() {
  const [hover, setHover] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const active = hover;
  const keycap = active === null ? null : KEYCAPS[active];

  return (
    <section id="sigils" className="sigils sec--black" data-chapter="sigils">
      <div className="sigils__head">
        <p className="meta">CHAPTER 04 — SIGILS</p>
        <p className="meta">ELDER FUTHARK · 24 SPECIMENS</p>
      </div>

      <ul className={`rune-grid${hover !== null ? ' has-hover' : ''}`} onMouseLeave={() => setHover(null)}>
        {RUNES.map((r, i) => (
          <li key={r.index}>
            <button
              type="button"
              className={`rune${hover === i ? ' is-hover' : ''}`}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => setOpen(i)}
              aria-label={`${r.name}, specimen ${KEYCAPS[i].specimen}`}
            >
              <span className="rune__glyph" aria-hidden="true">{r.glyph}</span>
              <span className="rune__name">{r.name}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className={`sigils__readout${keycap ? ' is-shown' : ''}`} aria-live="polite">
        {keycap && active !== null ? (
          <>
            <Plate plate={keycap.plate} className="sigils__plate" />
            <dl className="sigils__meta">
              <div><dt>SPECIMEN</dt><dd>{keycap.specimen}</dd></div>
              <div><dt>INDEX</dt><dd>{String(RUNES[active].index).padStart(2, '0')}</dd></div>
              <div><dt>ROW</dt><dd>{keycap.row}</dd></div>
              <div><dt>POSITION</dt><dd>{keycap.position}</dd></div>
              <div><dt>MEANING</dt><dd>{RUNES[active].meaning}</dd></div>
            </dl>
          </>
        ) : null}
      </div>

      {open !== null ? <RuneSpecimen index={open} onClose={() => setOpen(null)} /> : null}
    </section>
  );
}
