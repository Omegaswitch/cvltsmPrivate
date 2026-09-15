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
works the road behind the traveller, a good stretch back. All of them are
solid and permanently present — nothing fades or blinks away. They **lurch**,
on a deliberately non-uniform stride that the deformed ones quantise into
stop-motion steps, with occasional whole-body spasms; they **surge**, each
closing and falling back on its own slow cycle so the gap keeps breathing
without ever shutting; and every one carries a pair of glowing red eyes.
Torch-bearers pool light on the road; the rest are lit only by what leaks out
of their own eyes.

Deeper in, a **rite** is under way — a pyre, a standing stone cut with a red
mark, hooded figures bowed around it and skull-topped stakes. Its firelight is
baked into the layer *behind* the congregation so they read as silhouettes;
only the flame itself is live. **Dead men lashed to poles** stand along the
treeline. Both are baked into the tiling strip, so they come round every time
the tile does rather than on a timer.

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

## Interface

The menu sits under the wordmark. Each item raises a **slide-up section
panel** over the scene — the canvas is never scrolled or transformed, so the
background stays exactly where it is while the panel travels. The hero is
marked `inert` while the panel is modal, focus is trapped and restored, and
Escape closes.

The panel carries three request states, all reachable today:

| State | When | What it shows |
|-------|------|---------------|
| Loading | while the section is fetched | pulsing indicator, `aria-busy` |
| Empty | the section has no entries | "Nothing filed here yet" |
| Error | the fetch failed or timed out | the reason, plus a retry that clears the cache |

Section content is fetched from `content/<section>.json`, shaped
`{ "items": [{ "title": "…", "body": "…" }] }`. The files ship empty, which is
why every section currently shows the empty state.

## Request layer

`js/net/client.js` wraps `fetch` with the things a page needs to survive a bad
network:

- **Timeouts** — every attempt gets its own `AbortController` deadline.
- **Retries** — exponential backoff with full jitter, on network failures,
  408, 429 and 5xx only. `Retry-After` is honoured when present. Writes are
  never retried blind.
- **De-duplication** — concurrent callers asking for the same key share one
  in-flight promise.
- **Idempotent writes** — `submitOnce(url, body, { idempotencyKey })` will not
  post twice: a key already in flight returns that promise, a key already
  settled returns its result. The key is also sent as `Idempotency-Key`.
- **Read cache** — TTL cache in memory and `sessionStorage`, so reopening a
  section costs nothing.
- **Client quota** — a token bucket that refuses to flood an endpoint.

Two honest caveats. A client-side quota is a politeness guard, **not** rate
limiting: it lives in the page and anyone can bypass it by not using the page.
Likewise `Idempotency-Key` only prevents duplicate work if the server honours
it. Both have to be enforced server-side to mean anything.

## Logging

`js/lib/log.js` emits flat JSON records with a stable shape
(`ts`, `level`, `event`, `session`, …) and keeps the last 200 in a ring
buffer. `window.onerror` and `unhandledrejection` are captured. Nothing is
shipped anywhere by default — `log.setSink(fn)` is where a collector plugs in.
`window.CVLTSM.logs()` dumps the buffer for a bug report.

## Testing

```sh
npm run lint
npm run test:load       # 12 concurrent sessions, self-serving
```

The load test is shaped around what this site actually is. There is no
application server to saturate; every visitor generates the whole scene in
their own browser, so the load is on the client. It measures a **baseline**
session alone on the machine (tight budget: boot and framerate) and then N
**concurrent** sessions, where it asserts correctness strictly — all boot, zero
errors — but only loosely gates framerate, because N headless browsers share
one CPU on the runner and real visitors do not share a CPU with each other.

## Running it

A static site — serve the directory over HTTP (ES modules will not load from
`file://`):

```sh
python3 -m http.server 8000     # or: npx serve .
```

Then open <http://localhost:8000>.

## Controls

The wood walks entirely by itself. No pointer, wheel, drag or key input moves
the background — scrolling belongs to the interface, not to the forest.

- **Lore / Expedition / Archive** — raise the section panel
- **Escape** — close it

`window.CVLTSM.seek(px)` jumps the world along, for inspecting a different
point in the tile without waiting out the walk.

## Audio

None. The page is silent: no music, no audio files, no Web Audio — nothing
that can make a sound.

## Performance & accessibility

- Single `requestAnimationFrame` loop, 60fps at 1600×900.
- **Fixed timestep.** Layer offsets are integer-snapped to keep the pixel grid
  exact, so a layer at 0.05 parallax moves one pixel every 0.6s. Advancing the
  world by a raw, jittering `dt` made those snaps land at uneven moments, which
  reads as background stutter even at a solid 60fps. Draining a fixed-size
  accumulator puts every snap on a regular beat.
- **Glow sprites are cached.** Each lantern, torch, ember and rune used to
  build a fresh radial gradient every frame — thousands of allocations a
  second, which showed up as a periodic GC hitch (worst frame 66ms) rather than
  a lower average. Bucketed by colour and radius, worst frame is now 16.8ms.
- The canvas is promoted to its own compositor layer so its per-frame repaint
  never drags the interface into a repaint with it.

## Texture

Snow on the trees is placed as a few short contiguous **caps** along the upper
edge of each branch tier, in two tones, rather than a dice roll per pixel. The
per-pixel version produced exactly the failure the pixel art literature warns
about — orphan pixels, single stray dots that read as static crawling over the
bushes instead of as snow. The guidance is to build texture from a few simple
clusters repeated with varied distribution, keep the colour count low, and
avoid scattered single-pixel detail:
[Pixel Art Tutorial](https://androidarts.com/pixtut/pixelart.htm),
[Pixelblog 2 — Texture](https://www.slynyrd.com/blog/2018/2/15/pixelblog-2-texture),
[Cluster sketching and painting](https://medium.com/pixel-grimoire/how-to-start-making-pixel-art-2-bcd705cb04d7).
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
js/main.js          boot: wires engine, panel and logging together
js/net/client.js    timeouts, retries, dedupe, quota, read cache
js/ui/panel.js      slide-up section panel + loading/empty/error states
js/lib/log.js       structured logging and global error capture
content/*.json      section content (ships empty)
tests/load.mjs      concurrent session load test
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
