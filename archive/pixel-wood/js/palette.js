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
  skyTop: '#160f1a',
  skyMid: '#100b15',
  skyLow: '#130d18',
  skyBottom: '#07060a',
  cloud: '#181222',
  cloudLit: '#241a2c',

  /* bark & earth */
  bark: '#110d0a',
  barkMid: '#181208',
  barkLit: '#221a11',
  barkDark: '#080706',
  soil: '#0b0908',
  moss: '#0d130d',

  /* cold frost highlights */
  frost: '#8099b3',
  frostMid: '#55697f',
  frostDeep: '#27334a',
  frostShadow: '#141a26',

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
  mist: '#161222',
  mistPale: '#1f1a2b',
  water: '#070811',
  waterLit: '#101522',
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
