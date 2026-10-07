/** True when this browser can create a WebGL context. Checked once, before any scene mounts. */
export function hasWebGL(): boolean {
  try {
    const cv = document.createElement('canvas');
    return !!(cv.getContext('webgl2') || cv.getContext('webgl'));
  } catch {
    return false;
  }
}
