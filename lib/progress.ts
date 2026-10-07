/**
 * Scroll progress shared with the 3D scene.
 *
 * GSAP writes these numbers on scroll; the scene reads them every frame. They
 * live outside React state on purpose: a re-render per scroll tick would cost
 * far more than the change it reports.
 */
export const progress = {
  /** 0 in the dark opening, 1 once the object has fully emerged */
  hero: 0,
};
