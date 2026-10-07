/** Shapes for the CVLTSM site content. Components read these; they hold no copy. */

/** An image. Until `src` is set the slot is an empty tile of the same aspect. */
export interface Plate {
  /** CSS aspect ratio, e.g. "4 / 5" */
  ratio: string;
  /** file the photograph goes to, under /public */
  path: string;
  /** public URL once the file exists */
  src?: string;
  alt: string;
}

export interface Kit {
  id: string;
  name: string;
  summary: string;
  plate: Plate;
}

export interface ColourSample {
  name: string;
  /** the flat colour of the chip, from the set's palette */
  hex: string;
}

export interface RenderPlate extends Plate {
  /** how much of the grid the plate takes: seven, five, six or all twelve columns */
  span: 'lead' | 'side' | 'half' | 'full';
}

export interface RitualPlate extends Plate {
  scale: 'wide' | 'small' | 'strip' | 'tall';
  align: 'left' | 'right' | 'centre';
}

export interface VendorRegion {
  region: string;
  /** names once confirmed; empty until then */
  vendors: string[];
}

export interface Credit {
  role: string;
  name: string;
}
