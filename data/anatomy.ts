import type { AnatomyLayer } from '@/types';

/**
 * The exploded stack, top to bottom. Each layer names the 3D asset that will
 * replace its placeholder plate (see README, "3D assets"). Dimensions are
 * placeholders until the drawings are measured.
 */
export const ANATOMY: AnatomyLayer[] = [
  {
    order: '01', name: 'LEGEND', dimension: 'Ø 18.4 MM', note: 'placeholder: dye-sublimated rune, lit from below',
    model: '/models/anatomy/01-legend.glb',
    plate: { ratio: '4 / 1', path: '/images/anatomy/01-legend.webp', alt: 'Anatomy layer 01, legend' },
  },
  {
    order: '02', name: 'CAP', dimension: 'H 11.2 MM', note: 'placeholder: PBT, sculpted top, dished',
    model: '/models/anatomy/02-cap.glb',
    plate: { ratio: '4 / 1', path: '/images/anatomy/02-cap.webp', alt: 'Anatomy layer 02, cap' },
  },
  {
    order: '03', name: 'STEM', dimension: 'H 4.6 MM', note: 'placeholder: MX-compatible cross stem',
    model: '/models/anatomy/03-stem.glb',
    plate: { ratio: '4 / 1', path: '/images/anatomy/03-stem.webp', alt: 'Anatomy layer 03, stem' },
  },
  {
    order: '04', name: 'SWITCH', dimension: 'H 15.8 MM', note: 'placeholder: MX housing, leaf contacts',
    model: '/models/anatomy/04-switch.glb',
    plate: { ratio: '4 / 1', path: '/images/anatomy/04-switch.webp', alt: 'Anatomy layer 04, switch' },
  },
  {
    order: '05', name: 'PLATE', dimension: '1.5 MM', note: 'placeholder: brass plate, laser cut',
    model: '/models/anatomy/05-plate.glb',
    plate: { ratio: '4 / 1', path: '/images/anatomy/05-plate.webp', alt: 'Anatomy layer 05, plate' },
  },
];
