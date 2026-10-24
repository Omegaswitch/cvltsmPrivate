'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** The site's own furniture (the music, the loader), left out of the hidden station, which has its own. */
export function SiteOnly({ children }: { children: React.ReactNode }) {
  // a second way in, for whoever opens the console
  useEffect(() => {
    console.log('%cᚠᛁᛖᛚᛞ ᛊᛏᚨᛏᛁᛟᚾ 7 · the carvers left their name at the foot of the page. the code is in the small print', 'color:#a80800;font-size:13px');
  }, []);
  return usePathname()?.startsWith('/svartskog') ? null : <>{children}</>;
}
