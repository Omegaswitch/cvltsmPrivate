# Archived: the pixel wood

The original CVLTSM landing page — a six-layer procedurally generated pixel-art
forest that scrolls past forever, with a lantern-carrying traveller, a pack
chasing him, a rite burning between the trees, and a hidden side-scrolling
game behind ten clicks on the wordmark.

**This is not the live site.** It is kept whole and self-contained here so it
can be picked back up later. Nothing outside this folder is needed: it carries
its own copy of the font and of the shared infrastructure it was built with.

## Running it

Serve this directory over HTTP (ES modules will not load from `file://`):

```sh
cd archive/pixel-wood
python3 -m http.server 8000
```

## What is in here

```
index.html          markup + interface overlay
css/style.css       interface, vignette, responsive rules
fonts/              Valhalica, the display face
js/engine.js        framebuffer sizing, world travel, tiled composition
js/scene/*.js       one module per parallax layer, plus trees, crows, gait,
                    the traveller and the pack chasing him
js/game/runner.js   SKOGLØP — the hidden run
js/ui/*             slide-up section panel, the ten-click unlock
js/net/client.js    timeouts, retries, dedupe, quota, read cache
js/lib/*            seeded noise, pixel drawing primitives, structured logging
content/*.json      section content (ships empty)
```

## The things worth remembering

- **Integer upscaling.** The whole scene renders into one low-resolution
  framebuffer which is then scaled by an exact integer factor, so every source
  pixel maps to an N×N block and nothing is ever resampled.
- **Tiling strips.** Every layer is a horizontally tiling canvas drawn at a
  wrapping offset, so the world scrolls forever. Cloud and mist fields use
  periodic fBm and ridgelines close on themselves.
- **Fixed timestep.** Integer-snapped layer offsets need snaps to land on a
  regular beat, or a slow layer judders even at a solid 60fps.
- **Clustered texture.** Snow is laid as short contiguous caps, never as a
  dice roll per pixel — scattered single pixels read as static.
- **Walk cycle.** Four key poses with two-bone IK on the knees, in
  `js/scene/gait.js`.

Full notes are in the repository history for this directory.
