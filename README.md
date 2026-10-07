# CVLTSM

A ritual circle of sixteen runes, burned into a stone floor under fog. One
ember lights the glyphs from within, and the menu lives in the margins of the
picture. Rendered in the browser with a single WebGL fragment shader: no
library, no image assets, no build step.

![the sigil](docs/preview.png)

## The design

**Visual thesis.** A ritual that has not finished. The subject is the sigil;
the interface is set around it, never over it.

**Motion brief.** One signature motion, and everything else supports it.

| | |
|---|---|
| Signature | The sigil ignites. The ring lights first, then the sixteen glyphs in order, clockwise from the top. The menu is wired to it: hovering or focusing a section lights that section's glyph. |
| Supporting | Fog drifting through the air and thickest at the floor. A slow dolly and sway of the camera. The glyphs breathe, and their light falls off into the fog. |
| Intensity | Low. The sigil is the only thing that brightens; nothing flashes. |
| Reduced motion | The scene draws one lit frame and holds it. Nothing animates, and the menu still answers focus and hover. |
| No WebGL | The same geometry is shown as a static SVG, lit everywhere. |

**Type.** Valhalica for the wordmark and panel titles, Cormorant Garamond for
the menu and body copy (the roman numerals are italic), JetBrains Mono for the
small labels in the panel.

**Palette.** Near-black `#050507`, bone `#e8e1d6`, ash `#8d8794`, ember
`#ff3b2f` with a hot core at `#ff8a66`. The ember is the only saturated colour.

## How it is drawn

Everything in the sigil is plain numbers in `js/sigil/glyphs.js`: the ring, the
ticks, and the sixteen glyphs as stroke segments in a unit box. Two things are
built from those numbers and cannot drift apart:

- `js/sigil/texture.js` paints them into a 1024² canvas that the shader samples.
  Alpha is the stroke's coverage, so the edges are antialiased, and the red
  channel is each stroke's *order*, which decides when it lights.
- `js/sigil/fallback.js` builds the same drawing as an SVG for browsers without
  WebGL.

`js/sigil/shader.js` is the scene: it marches the fog from the eye in fourteen
steps, takes the floor where the ray meets it, reads the sigil from the
texture, and tone-maps with a dither against banding in the dark.

`js/sigil/gl.js` owns the context and the frame loop. It lowers the resolution
the scene is drawn at when frames run long, and raises it again once there is
headroom, with a cooldown so it does not flip between sizes. A weak phone gets a
softer image rather than a stutter.

## Layout

```
index.html            markup: canvas, wordmark, menu, section panel
css/style.css         the interface and the still fallback
js/main.js            boot: sigil, fallback, menu hover, panel
js/sigil/glyphs.js    the runes and the sigil's geometry
js/sigil/texture.js   paints the geometry into the sampled texture
js/sigil/shader.js    the scene shader
js/sigil/gl.js        WebGL driver: ignition, hover, adaptive resolution
js/sigil/fallback.js  the static SVG for browsers without WebGL
js/ui/panel.js        slide-up section panel and its loading/empty/error states
js/net/client.js      timeouts, retries, dedupe, quota, read cache
js/lib/log.js         structured logging and global error capture
content/*.json        section content (ships empty)
fonts/                Valhalica, the display face
tests/load.mjs        concurrent session load test
archive/              the two earlier designs, kept whole (see below)
```

## Branding slots

- **Manufacturer logo**: `<div class="crest__mfr" id="mfrLogo">`, above the
  wordmark. It keeps its width while empty and draws nothing, so the wordmark
  never moves when a logo arrives.
- **CVLTSM wordmark**: the `<h1>`, in Valhalica. Replace its contents with an
  `<img>` when the official artwork arrives.

## Sections

Each section is a glyph on the ring, so the menu's `data-rune` attribute is the
glyph's index: Lore → 0, Expedition → 4, Archive → 8, Rites → 12. Opening a
section raises the panel over the sigil, which keeps running behind it. The
panel has loading, empty, error and ready states. Content is read from
`content/<section>.json`, shaped `{ "items": [{ "title": "…", "body": "…" }] }`.
Every file ships empty, so each section shows its empty state until real copy
is supplied.

## Request layer

`js/net/client.js` wraps `fetch`: a deadline on every attempt, exponential
backoff with full jitter on network failures and 408/429/5xx (honouring
`Retry-After`), de-duplication of concurrent requests, an `Idempotency-Key` on
`submitOnce`, a TTL read cache, and a client-side token-bucket quota. The quota
is a politeness guard, not rate limiting: it runs in the page, so enforcement has
to live on the server.

## Logging

`js/lib/log.js` emits flat JSON records (`ts`, `level`, `event`, `session`, …)
and keeps the last 200 in a ring buffer. `window.onerror` and
`unhandledrejection` are captured. `log.setSink(fn)` is where a collector plugs
in. `window.CVLTSM.logs()` dumps the buffer for a bug report.

## What was measured, and what was not

This design was built and checked in a headless browser on a machine **with no
GPU**. WebGL there is software-rendered (SwiftShader), so:

- **Frame rate is not known for real hardware.** Under software rendering the
  scene runs at roughly 3 fps and the adaptive resolution drops to its floor.
  That number says nothing about a phone or a laptop with a GPU, and it has not
  been measured on one.
- The load test's baseline gate (50 fps) therefore fails on this runner. It was
  calibrated for the previous canvas renderer. Boot, error and correctness
  checks pass for all twelve sessions.
- Layout, the ignition, the hover link, the panel states, the still fallback and
  reduced motion were all checked by screenshot and by script.

The fog march is the expensive part (fourteen steps of four-octave noise per
pixel). If it proves heavy on real phones, the first thing to cut is the number
of steps.

## Running it

A static site. ES modules will not load from `file://`:

```sh
npm start                       # or: python3 -m http.server 8000
```

Then open <http://localhost:8000>.

```sh
npm run lint
npm run test:load               # 12 concurrent sessions, self-serving
```

## Audio

None. There is no audio and nothing that can make a sound.

## Archive

Both earlier designs are kept whole and runnable, each with its own copy of the
font and the shared code:

- [`archive/wheat-field/`](archive/wheat-field/) — the field at night with an
  effigy in the crop, the ring of sections around it.
- [`archive/pixel-wood/`](archive/pixel-wood/README.md) — the six-layer pixel
  forest, with a traveller, a pack chasing him and a hidden game.
