# CVLTSM

An immersive dark-fantasy landing page: a six-layer pixel-art forest that
scrolls past forever while a lantern-carrying traveller walks through it.
Rendered entirely in the browser — no image assets, no sprite sheets on disk,
no build step.

![the wood](docs/preview.png)

## What it is

Every pixel of the scene is generated procedurally at load from a fixed seed —
the peaks, the rune carvings, the crows, the traveller's 8-frame walk cycle.
The whole frame renders into one low-resolution canvas which is then upscaled
by an **exact integer factor** with `image-rendering: pixelated`, so every
source pixel maps to an N×N block and nothing is ever resampled.

**The world travels.** Each layer is a horizontally *tiling* strip drawn at a
wrapping offset, so the forest streams right to left without end. The traveller
holds a fixed point in frame and the ground moves beneath him at exactly the
pace his stride implies — he is permanently mid-step and never arrives.

## Layers

| # | Layer | Parallax | Contents |
|---|-------|----------|----------|
| 0 | Celestial & distant peaks | 0.05 | Mauve→charcoal gradient, storm cloud noise, blood-tinged moon ring, snow-capped ridges, monolith ruins, cliffside waterfall |
| 1 | The colossal antlered entity | 0.12 | A Jötunn above the canopy; crimson eyes flare, narrow and settle on a ~17s cycle. It drifts out of frame and, later, is standing there again |
| 2 | Deep fog & cultists | 0.25 | Receding tree walls, drifting mist ribbons, a torch-lit procession with a blood banner |
| 3 | Ancient sentinel pines & runes | 0.45 | Colossal bark columns carved with stacked runes; the glow breathes and spills red onto the bark. Crowns are a separate pass drawn *after* the glow, so foliage occludes it |
| 4 | Road, water & bridges | 0.70 | Frozen moss and mud, snow-caked scrub, rickety log bridges, scanline water carrying rune and lantern reflections |
| 5 | Foreground framing & totems | 1.00 | Twisted roots, frost-tipped boughs, near-black trunks sweeping past, the antler skull totem |

Crows cross between layers 2 and 3. A pack of cultists and deformed things
works the road behind the traveller, a good stretch back. Three things make
them: they **fade**, each running its own visibility cycle and simply gone for
part of it — and while gone, its position is re-rolled from a hash of the
cycle number, so it never returns to quite where you last saw it; they
**lurch**, on a deliberately non-uniform stride that the deformed ones
quantise into stop-motion steps; and their **eyes never go out**, a pair of
red embers each that stay lit a little longer than the body they belong to.
Torch-bearers pool light on the road; the rest are lit only by what leaks out
of their own eyes.

Fog is **not** an overlay: it is split into three depth bands drawn at three
different points in the layer order — a high haze banked behind the treeline,
banks rolling over the road, and thin wisps crossing in front of the
foreground. The sentinels and the deadfall sit *inside* the weather rather
than under a sheet laid over the finished frame, and each bank drifts at its
own fraction of the walk, so the near fog moves visibly faster than the far
haze.

Layers bake once into offscreen buffers; only what must live (eyes, runes,
torches, ripples, reflections, crows, the traveller) is repainted each frame.

## Branding slots

Two slots in `index.html` are waiting for real artwork, both marked with
comments:

- **Manufacturer logo** — `<div class="hero__mfr" id="mfrLogo">`, directly above
  the wordmark. Drop an `<img>` straight in; the empty placeholder frame
  disappears automatically once an image is present.
- **CVLTSM wordmark** — the `<h1>`, currently set in Valhalica
  (`fonts/Valhalica-Regular.otf`). Replace its contents with the official logo
  `<img>` when it arrives; the styling already handles an image.

## Running it

A static site — serve the directory over HTTP (ES modules will not load from
`file://`):

```sh
python3 -m http.server 8000     # or: npx serve .
```

Then open <http://localhost:8000>.

## Controls

The wood walks by itself and the pointer never moves the camera — the forest
simply passes behind him. Input only changes the pace:

- **Scroll / drag / swipe / ← →** — push the journey forward or hold it back

## Audio

None. The page is silent: no music, no audio files, no Web Audio — nothing
that can make a sound.

## Performance & accessibility

- Single `requestAnimationFrame` loop, 60fps at 1600×900.
- The framebuffer is sized to ~360 virtual pixels tall regardless of viewport,
  so cost is near-constant from a phone to a 4K display.
- Rendering pauses on `visibilitychange`; layers rebuild on a debounced resize.
- `prefers-reduced-motion: reduce` stops the world entirely — no travel, fog
  drift, crows, walk cycle or eye flare.
- The canvas carries a descriptive `aria-label`; the interface is keyboard
  navigable with visible focus rings, and there is a `<noscript>` fallback.

## Layout

```
index.html          markup + interface overlay
css/style.css       interface, vignette, responsive rules
fonts/              Valhalica, the display face
js/main.js          boot: wires engine to the UI
js/engine.js        framebuffer sizing, world travel, tiled composition
js/palette.js       the scene palette and depth factors
js/runes.js         rune glyph bitmaps
js/lib/rng.js       seeded PRNG, value noise, tiling fBm, ridgelines
js/lib/paint.js     integer-snapped pixel primitives, seam wrapping
js/scene/*.js       one module per layer, plus trees, crows, the
                    traveller and the pack chasing him
```

## Seed

The wood is deterministic. Change `SEED` in `js/engine.js` to grow a different
one under the same rules; `TILE` in the same file sets how far each layer runs
before it repeats.
