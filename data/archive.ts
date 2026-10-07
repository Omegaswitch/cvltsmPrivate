import type { ArchiveImage } from '@/types';

/**
 * The contact sheet. Twelve slots with deliberately mixed aspect ratios.
 * Every `plate.path` is where the photograph goes; `src` stays unset until it
 * exists, and the slot shows its placeholder in the meantime.
 */
const ratios = ['4 / 5', '3 / 2', '1 / 1', '2 / 3', '4 / 3', '3 / 4', '1 / 1', '5 / 4', '2 / 3', '3 / 2', '4 / 5', '1 / 1'];

export const ARCHIVE: ArchiveImage[] = ratios.map((ratio, i) => {
  const id = `IMG_${String(i + 1).padStart(3, '0')}`;
  return {
    id,
    site: 'SITE UNKNOWN',
    time: `00:${String(20 + i * 3).padStart(2, '0')}:${String(7 + i * 11).padStart(2, '0')}`,
    caption: 'placeholder caption',
    plate: {
      ratio,
      path: `/images/archive/${id}.webp`,
      alt: `${id}, archive photograph`,
    },
  };
});
