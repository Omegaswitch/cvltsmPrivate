/** The names and marks the site is built around. Logos live in public/brand/. */
export const BRAND = {
  name: 'CVLTSM',
  /** the production address: canonical links, share images, the sitemap. On
   *  Vercel, the project's own production domain, so a copy deployed elsewhere
   *  shows its own share image, not the one at cvltsm.cat */
  url: process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://cvltsm.cat',
  year: '2027',
  /** the set's logo: the artwork's marks in its red (scripts/make-logo.py); unset, the name would stand in Valhalica */
  logo: '/brand/cvltsm.png' as string | undefined,
  /** the picture a shared link shows. A new picture takes a new name (bump the
   *  number): chat apps keep the old picture for as long as the address is the same */
  share: '/share/cvltsm-v2.png',
  manufacturer: { name: 'SWG', logo: '/brand/SWGX.png' },
  /** the line at the very foot of the page */
  credit: 'manu x omegaswitch x stellaidoscope',
  /** who answers privacy questions */
  contact: 'omegaswitch on Discord',
};
