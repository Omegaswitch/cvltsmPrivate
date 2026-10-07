/**
 * Shared shapes for the exhibition's content. Every item on the site comes from
 * a file in /data that matches one of these; components never hold copy.
 */

/** An image plate. When `src` is absent the plate renders a labelled placeholder. */
export interface PlateSource {
  /** aspect ratio, CSS form, e.g. "4 / 5" */
  ratio: string;
  /** where the final file goes, relative to /public */
  path: string;
  /** public URL once the file exists; leave undefined until then */
  src?: string;
  alt: string;
}

export interface Rune {
  index: number;          // 1..24 in the futhark
  glyph: string;          // the Unicode Elder Futhark character
  name: string;           // FEHU, URUZ, ...
  transliteration: string;
  meaning: string;        // one line, placeholder until the research note is written
}

export interface Keycap {
  specimen: string;       // RIT-001 ...
  rune: Rune;
  row: number;            // 1..4
  position: number;       // 1..6 within the row
  plate: PlateSource;     // macro image of this keycap
  profile: string;
  legend: string;
  material: string;
}

export interface ArchiveImage {
  id: string;             // IMG_001 ...
  plate: PlateSource;
  site: string;
  time: string;           // 00:43:17
  caption: string;
}

export interface RitualPlateItem {
  label: string;          // PLATE 05.3
  site: string;
  time: string;
  plate: PlateSource;
  /** how much of the viewport the plate takes, and where it sits */
  scale: 'wide' | 'small' | 'strip' | 'tall';
  align: 'left' | 'right' | 'centre';
}

export interface AnatomyLayer {
  order: string;          // 01 ...
  name: string;           // LEGEND ...
  dimension: string;      // placeholder measurement
  note: string;
  /** future 3D asset for this layer; see README "3D assets" */
  model: string;
  plate: PlateSource;
}

export interface MetaRow {
  key: string;
  value: string;
}
