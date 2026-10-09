/**
 * The marks the site is built around. Until the final artwork exists, each
 * logo is undefined and its place in the layout is held by a marked slot of
 * the right size. Put the file in public/brand/ (SVG preferred) and set its
 * path here; nothing else needs to change.
 */
export const BRAND = {
  name: 'CVLTSM',
  year: '2027',
  /** the CVLTSM keycap set logo: the focal point of the opening */
  logo: undefined as string | undefined,
  /** the manufacturer: named and placed, but always second to the set */
  /** the line at the very foot of every page */
  credit: 'manu x omegaswitch x stellaidoscope',
  /** who answers privacy questions; shown in the privacy policy once set */
  contact: undefined as string | undefined,
  manufacturer: {
    name: 'SWG' as string | undefined,
    logo: '/brand/SWGX.png' as string | undefined,
  },
};
