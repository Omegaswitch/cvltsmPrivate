'use client';

import { useEffect, useState } from 'react';
import { SET } from '@/data/site';
import { RENDERS } from '@/data/renders';

// the renders section exists only once there are renders to show
const HAS_RENDERS = RENDERS.some((r) => r.src);

const LINKS = [
  { id: 'kits', label: 'Kits' },
  { id: 'colour', label: 'Colour' },
  ...(HAS_RENDERS ? [{ id: 'renders', label: 'Renders' }] : []),
  { id: 'vendors', label: 'Vendors' },
];

/** Every section the header tracks, top of the page first. */
const TRACKED = ['top', 'kits', 'colour', ...(HAS_RENDERS ? ['renders'] : []), 'ritual', 'vendors', 'credits'];

/**
 * The section whose top has most recently passed a line a third of the way
 * down the screen. Measured by position on scroll, so it works for short
 * sections as well as tall ones.
 */
function currentSection(): string {
  // the page cannot scroll the footer to the top, so at the very bottom it is the section
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) return 'credits';
  const line = window.innerHeight * 0.34;
  let current = TRACKED[0];
  for (const id of TRACKED) {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= line) current = id;
  }
  return current;
}

export function Header() {
  const [active, setActive] = useState(TRACKED[0]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setActive(currentSection());
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header className="header">
      <a className="header__mark" href="#top">{SET.name}</a>
      <nav className="header__nav" aria-label="Sections">
        {LINKS.map((l) => (
          <a
            key={l.id}
            href={`#${l.id}`}
            aria-current={active === l.id ? 'location' : undefined}
            className={active === l.id ? 'is-active' : undefined}
          >
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
