/** The names and marks the site is built around. Logos live in public/brand/. */
export const BRAND = {
  name: 'CVLTSM',
  /** the production address: canonical links, share images, the sitemap */
  url: 'https://cvltsm.cat',
  year: '2027',
  /** the set's logo: the artwork's marks in its red (scripts/make-logo.py); unset, the name would stand in Valhalica */
  logo: '/brand/cvltsm.png' as string | undefined,
  manufacturer: { name: 'SWG', logo: '/brand/SWGX.png' },
  /** the line at the very foot of the page */
  credit: 'manu x omegaswitch x stellaidoscope',
  /** who answers privacy questions */
  contact: 'omegaswitch on Discord',
};
