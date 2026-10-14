'use client';

import { glide } from './Glide';

/** The link at the left of the menu: the manufacturer's mark, the set's name joining it, and a way back to the top. Its box is only the area that takes the click. */
export function Home({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <a
      className="nav__home"
      href="/"
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        glide(0);   /* the same quick glide as the section links */
      }}
    >
      {children}
    </a>
  );
}
