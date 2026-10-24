'use client';

import { useEffect } from 'react';
import { HOT_GLYPHS, HOT_SECONDS, PHOSPHOR, clamp, hotStyle, useElapsed } from './phosphor';

/**
 * The CRT write head, ported from the SWS Nostromo terminal, in red: the gun strikes the row before it draws, an overexposed
 * spot travels along the write head trailing a short smear, and every glyph
 * it leaves behind is white-hot for a beat before cooling to the resting
 * colour — a streak that follows the head along the line.
 *
 * The original read its clock from the composition; this one runs its own from
 * mount, so it can be dropped anywhere.
 */
export default function BeamText({
  text,
  /** Characters per second. */
  rate = 22,
  /**
   * The colour the glyphs settle to. Match it to the inherited text colour:
   * the last stage of the cooling is a fade into this value.
   */
  color = PHOSPHOR,
  /** Seconds to hold before the beam starts: nothing shows until then. */
  delay = 0,
  className = '',
  onDone,
}: {
  text: string;
  rate?: number;
  color?: string;
  delay?: number;
  className?: string;
  onDone?: () => void;
}) {
  const len = text.length;
  const write = len / rate;
  const hot = Math.min(HOT_SECONDS, HOT_GLYPHS / rate);
  // The hold, the writing, and the time the last glyph takes to cool.
  const raw = useElapsed(delay + write + hot);
  const started = raw >= delay;
  const T = Math.max(0, raw - delay);

  const n = clamp(Math.floor(T * rate), 0, len);
  const p = len === 0 ? 1 : n / len;
  const running = started && n < len;
  const done = T >= write + hot;

  // One hot scan pass across the row before any glyph is drawn.
  const strike = started ? clamp(1 - T / 0.16, 0, 1) * 0.45 : 0;

  useEffect(() => {
    if (!onDone) return;
    const id = setTimeout(onDone, (delay + write) * 1000);
    return () => clearTimeout(id);
  }, [delay, write, onDone]);

  const tailStart = Math.max(0, n - HOT_GLYPHS);

  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        whiteSpace: 'pre-wrap',
        // Snug leading keeps the box close to the glyphs. The beam furniture
        // below is pinned to the middle of the first line (half a line-height
        // down) rather than the middle of the box, so a message that wraps
        // does not leave the beam floating in the gutter between lines.
        lineHeight: 1.35,
      }}
    >
      {done ? (
        text
      ) : (
        <>
          {/* The whole line, invisible, holds the box: nothing reflows as
              glyphs land. It is also what assistive tech reads — the full
              text, not the half-written one. */}
          <span style={{ opacity: 0 }}>{text}</span>
          <span aria-hidden style={{ position: 'absolute', inset: 0 }}>
            {text.slice(0, tailStart)}
            {Array.from(text.slice(tailStart, n), (ch, k) => {
              const i = tailStart + k;
              return (
                <span key={i} style={hotStyle(T - i / rate, hot, color)}>
                  {ch}
                </span>
              );
            })}
          </span>
        </>
      )}
      {running ? (
        <>
          {/* electron gun spot at the write head */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: `${p * 100}%`,
              top: '0.675em',
              transform: 'translate(-50%, -50%)',
              width: 'max(3px, 0.09em)',
              height: '1.1em',
              background:
                'linear-gradient(180deg, transparent, #ffffff 15%, #ffffff 85%, transparent)',
              boxShadow: `0 0 0.4em 0.1em ${color}cc, 0 0 1em 0.25em ${color}55`,
              opacity: 0.92,
              pointerEvents: 'none',
            }}
          />
          {/* the smear the head drags behind it */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: `max(0px, calc(${p * 100}% - 3ch))`,
              width: '3ch',
              top: '0.675em',
              transform: 'translateY(-50%)',
              height: '0.8em',
              background: `linear-gradient(90deg, transparent, ${color}66)`,
              pointerEvents: 'none',
            }}
          />
        </>
      ) : null}
      {strike > 0 ? (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: '-2%',
            right: '-2%',
            top: '0.675em',
            transform: 'translateY(-50%)',
            height: 2,
            background: `linear-gradient(90deg, transparent, ${color}, ${color}, transparent)`,
            boxShadow: `0 0 0.3em 0.06em ${color}88`,
            opacity: strike,
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </span>
  );
}
