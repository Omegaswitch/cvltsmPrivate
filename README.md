# CVLTSM — BLÓT

An immersive dark-fantasy landing page: a six-layer pixel-art horizontal
parallax scene of a Nordic folk-horror ritual wood, rendered entirely in the
browser. No image assets, no sprite files, no build step.

![six-layer parallax scene](docs/preview.png)

## What it is

Every pixel of the scene is generated procedurally at load from a fixed seed —
the mountains, the rune carvings, the cultists, the villager's 8-frame run
cycle. The whole frame renders into one low-resolution canvas which is then
upscaled by an **exact integer factor** with `image-rendering: pixelated`, so
every source pixel maps to an N×N block and nothing is ever resampled.

## Layers

| # | Layer | Parallax | Contents |
|---|-------|----------|----------|
| 0 | Celestial & distant peaks | 0.05 | Mauve→charcoal gradient, storm cloud noise, blood-tinged moon ring, snow-capped ridges, monolith ruins, cliffside waterfall |
| 1 | The colossal antlered entity | 0.12 | Jötunn silhouette above the canopy; crimson eyes flare, narrow and settle on a ~17s cycle |
| 2 | Deep fog & cultists | 0.25 | Receding tree walls, drifting mist ribbons, a torch-lit procession with a blood banner |
| 3 | Ancient sentinel pines & runes | 0.45 | Colossal bark columns carved with stacked runes; the glow breathes and spills red onto the bark |
| 4 | Path, water & runner | 0.70 | Frozen moss and mud, scrub, a rickety log bridge, scanline water ripples, the cloaked villager and his travelling lantern light |
| 5 | Foreground framing & totem | 1.00 | Twisted roots, frost-tipped boughs, snow-caked corner scrub, the antler skull totem |
| 6 | Weather overlay | fixed | Slanted pixel rain in three depth bands, low drifting fog banks |

Layers 0–5 are baked once into offscreen buffers; only the parts that must
live (eyes, runes, torches, ripples, reflections, the runner) are repainted
each frame. Compositing a frame is six `drawImage` calls plus the live passes.

## Running it

It is a static site — serve the directory over HTTP (ES modules will not load
from `file://`):

```sh
python3 -m http.server 8000     # or: npx serve .
```

Then open <http://localhost:8000>.

## Controls

- **Mouse move** — subtle camera tilt and pan
- **Scroll / drag / swipe** — travel horizontally through the wood
- **← → / Home / End** — keyboard navigation
- **Nav links** — pan the camera to a scene position
- **Rain** — toggle the precipitation overlay
- **Ambient fx** — optional wind and rain bed

## Audio

There is **no background music**, and no audio file of any kind. The optional
ambient toggle synthesises filtered white noise (rain band-pass, wind low-pass
with slow gust LFOs) with the Web Audio API. It is off by default and never
starts without a user gesture.

## Performance & accessibility

- Single `requestAnimationFrame` loop, frame-rate independent camera easing,
  60fps at 1600×900.
- The framebuffer is sized to ~360 virtual pixels tall regardless of viewport,
  so cost is near-constant from a phone to a 4K display.
- Rendering pauses on `visibilitychange`; layers rebuild on a debounced resize.
- `prefers-reduced-motion: reduce` freezes the scene to a static composed
  frame, stops rain, fog, the run cycle and the eye flare, and damps the
  input parallax.
- The canvas carries a descriptive `aria-label`; the interface is keyboard
  navigable with visible focus rings, and there is a `<noscript>` fallback.

## Layout

```
index.html          markup + interface overlay
css/style.css       interface, post-processing, responsive rules
js/main.js          boot: wires engine to the UI
js/engine.js        framebuffer sizing, camera, composition loop
js/audio.js         ambient rain/wind synthesis (no music)
js/palette.js       the scene palette and depth factors
js/runes.js         rune glyph bitmaps
js/lib/rng.js       seeded PRNG, value noise, fBm, ridgelines
js/lib/paint.js     integer-snapped pixel drawing primitives
js/scene/*.js       one module per parallax layer, plus shared trees/villager
```

## Seed

The scene is deterministic. Change `SEED` in `js/engine.js` to generate a
different wood with the same rules.
