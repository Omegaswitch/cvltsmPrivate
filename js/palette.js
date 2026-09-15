/**
 * The scene palette. Deliberately tight — five families only, so the crimson
 * runes and the lantern are the only things in the frame that truly glow.
 */
export const PAL = {
  /* deep voids & shadow */
  voidBlack: '#08080a',
  voidSoft: '#111115',
  nearBlack: '#0b0a0e',

  /* sky & atmosphere */
  skyTop: '#1c1420',
  skyMid: '#150f1d',
  skyLow: '#1a1220',
  skyBottom: '#0a080d',
  cloud: '#1e1725',
  cloudLit: '#2d2136',

  /* bark & earth */
  bark: '#1a1510',
  barkMid: '#241c15',
  barkLit: '#33281d',
  barkDark: '#0e0b09',
  soil: '#14110f',
  moss: '#17201a',

  /* cold frost highlights */
  frost: '#9bb7d4',
  frostMid: '#6d87a4',
  frostDeep: '#33425a',
  frostShadow: '#1d2533',

  /* ritual crimson */
  crimson: '#e61c38',
  crimsonHot: '#ff5a6e',
  crimsonDim: '#8e1223',
  crimsonDeep: '#4a0a14',

  /* lantern & torch amber */
  amber: '#ff9f38',
  amberPale: '#ffd9a0',
  amberDeep: '#a8541a',

  /* mist */
  mist: '#1c1727',
  mistPale: '#2b2438',
  water: '#0d0f16',
  waterLit: '#1b2130',
};

/** Parallax depth factors, back to front. */
export const DEPTH = {
  sky: 0.05,
  jotunn: 0.12,
  deepForest: 0.25,
  sentinels: 0.45,
  path: 0.7,
  foreground: 1.0,
};
