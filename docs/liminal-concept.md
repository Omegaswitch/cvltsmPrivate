# GMK Liminal — Interactive Promotional Site: Concept & Execution Plan

## Context

GMK Liminal is an enthusiast keycap set themed on the Backrooms. The site must sell the set to a discerning
audience (collectors who judge colorways on render accuracy) while being art in its own right.
The brief rules out pixel art, nostalgia clichés and generic grunge. So the Backrooms is treated as
**architecture, not horror**: the register of a facilities-management document that has quietly
stopped describing a real building.

The repo (`omegaswitch/cvltsm`) currently holds an unrelated dark-fantasy canvas page (vanilla JS,
no build step; `archive/` is already used to retire old designs). All set details below (names, specs,
prices, vendors) are **placeholders to swap for real data** — none of it is confirmed.

## Core Concept: "Scale Inversion"

> A keycap is a room. A keyboard is a floor plan. You are never told which scale you are at.

Every scene is built from one ambiguity: the camera is either macro on a keycap or at eye level in an
office corridor, and the two resolve into each other. Keycap tops are the same beige as carpet; the
1.5 mm wall of the cap is a wall; the gap between keys is a corridor; a sculpted spacebar dish is a
vaulted ceiling. The set's *product shots* and the *environment* are literally the same geometry, so
the 3D asset budget is spent once.

Tone rule: copy is written like an asset register ("Unit 04 / Standard issue / Condition: occupied").
Nothing says "welcome to the Backrooms", no creepypasta, no "you noclipped".

## 1. Visual Language & UI

### Color (all validated against WCAG AA for text on its surface)
| Token | Hex | Role |
|---|---|---|
| `carpet` | `#B8A987` | Damp-beige base; dominant surface (60%) |
| `wallpaper` | `#C9BC6A` | Faded yellow; secondary planes, legend fills (25%) |
| `tile` | `#DAD7C4` | Ceiling tile / UI panels; page background in light sections |
| `tube` | `#E8F4B8` | Fluorescent light source; the only "bright" in the palette |
| `sick` | `#8FA34B` | Fluorescent-green accent; links, focus, active state (≤5%) |
| `damp` | `#6F6A3C` | Water-stain shadow tone; borders, dividers |
| `void` | `#0E0F09` | Near-black green; text, the unlit end of corridors |

Rules: no pure white, no pure black. Light is always slightly green-yellow (a cheap tube's 4100K
spectral spike), shadows are olive, never grey. Saturation stays low everywhere except `tube` and
`sick`. Dark sections invert to `void` with `tube` text, never navy or purple.

### Typography (sterile architectural, with one corporate artefact)
- **Display / headings:** a neutral grotesque at light weight, wide tracking, sentence case
  (Instrument Sans or Neue Haas–style; both OFL/licensable). Large, calm, lots of leading.
- **Wayfinding / labels:** Archivo Narrow (DIN-adjacent), uppercase, small. Only used for sign-like
  labels (`LEVEL 0 · UNIT 04`), at most one per viewport.
- **Specs / data:** IBM Plex Mono at 12–13px, tabular figures, for the kit tables and prices.
- **The single retro-corporate artefact:** a **safety placard** component (rounded rectangle, pictogram,
  two-line legend) used for exactly three things: sound toggle, motion-reduction toggle, "Join the
  group buy". Everything else stays architectural. This keeps the corporate joke from becoming a theme park.

### Interface styling
- Layout follows a **modular grid visible only as hairlines** (1px `damp` at 20% opacity), like an
  architect's reference grid. Content snaps to it; the grid itself fades in on scroll rest.
- Panels are flat `tile` rectangles with a 1px `damp` border and a 2px `carpet` bottom edge. No
  shadows, no glass, no gradients beyond the lighting itself.
- Cursor: a small crosshair-less square outline that snaps to the grid; over a keycap it becomes a
  1:1 "plan view" bounding box with its unit number.
- Imagery is **rendered, never photographed**; no film grain, no VHS, no chromatic aberration, no
  vignette-heavy filters. Quality comes from lighting and material accuracy.

## 2. Motion Design & Interaction

### Global motion principles
- One easing family: slow in, slow out (`cubic-bezier(.65,0,.35,1)`), 700–1200ms. Nothing bounces.
- The world **never stops moving slightly**: tube flicker, a 0.3px camera drift, dust in the light cone.
- Scroll drives a **single camera rail** (CatmullRom spline) with Lenis smoothing; GSAP ScrollTrigger
  maps scroll progress → spline `t`, light state, and section reveals. Camera look-at leads position
  by ~4% so turns feel inertial.

### Ambient systems (always on)
1. **Fluorescent flicker:** each tube has a seeded, non-periodic flicker (noise gate, 2–4 events/min,
   120ms max). One tube per corridor is *slightly* dead and hums a half-step flat.
2. **Damp carpet shader:** procedural (no texture): tufted micro-normal + low-frequency moisture
   mask that darkens/desaturates; the mask slowly migrates (period ≈ 90s).
3. **Dust:** ~600 instanced motes in light cones only, lifespan-faded, never in shadow.
4. **Depth cue:** exponential fog tinted `wallpaper`→`void`; corridors always end slightly too far away.

### Sound design (opt-in, off by default, placard toggle)
- Bed: 120 Hz mains hum with 240/360 Hz harmonics, filtered to be felt more than heard; −34 LUFS.
- Room tone convolved with a real carpeted-office impulse response.
- **Key sounds are real recorded cap sounds** (thock/clack of the set on a reference board), ties
  the atmosphere back to the product. Keys pressed on the page play them with randomised pitch ±3%.
- Cross-fade the bed's low-pass by section depth (further in = darker/closer).
- Web Audio only; resume on first gesture; mute on `visibilitychange`; honor `prefers-reduced-motion`
  by dropping flicker-sync audio events.
- Haptics: `navigator.vibrate(8)` on key press and (2×6ms) on the tube flicker, Android only;
  silently absent on iOS/desktop. Never required for any information.

### Micro-interactions
- **Keys are typeable:** the page's 3D keyboard accepts real keyboard input; the matching cap
  depresses 1.2mm with spring settle, the legend lights from within for 400ms, and the key's unit number
  appears in the HUD. This is the core "feel it" hook.
- **Hover a keycap:** it lifts 0.3mm, the surrounding caps dim 15%, and the mono spec line appears.
- **Drag to orbit** a cap (limited polar range) with inertia; double-click to reset.
- **Light switch:** pressing `L` (or the placard) cuts the tubes; scene falls to emergency-green
  rim light; the legends (doubleshot translucency) become the only light source. A genuine
  material demo, not a gimmick.

## 3. Site Architecture & Journey (one scroll, 10 stations)

Camera moves along a single continuous rail. Each station is a "unit".

| # | Station | Scene (what you see) | Trigger / function |
|---|---|---|---|
| 0 | **Lobby (Hero)** | Black. A tube stutters on over a single blank carpet-beige cap at macro scale. Title `GMK Liminal` set in the grotesque; a grid hairline fades in. | Auto-plays 6s. Any key press: a legend lights. Scroll cue is a small placard, not an arrow. |
| 1 | **Premise** | Camera pulls back; the cap's edge becomes a wall corner; the keyboard resolves as a floor plan seen in elevation. | Scroll-scrubbed 1.6 screens. Three short asset-register paragraphs reveal by line. |
| 2 | **Colorway** | Corridor of swatch-walls: `carpet`, `wallpaper`, `tube`, `sick`, `void`, each with name, hex, and the real ABS dye note. | Hover a wall → its swatch maps to a 3D cap that rotates to show doubleshot depth. |
| 3 | **Base kit** | A long corridor of ~104 caps arranged as a full-size layout, receding. Camera tracks along it. | Click a key → drawer opens with legend, profile, unit count. Layout switcher (ANSI/ISO/TKL/60%) rearranges caps with a staggered shuffle. |
| 4 | **Novelties** | A row of doors; each opens to a lit cap display (e.g. EXIT, wet-floor, outlet, tile, vent, bolt). | Door click → 3D cap with turntable; compatibility tag (e.g. 1u, R1–R4). |
| 5 | **Spacebars & alphas/mods** | Ceiling-level shots, vaulted spacebar dish seen from beneath. | Scroll parallax, tilt-shift focus pull between 6.25u / 7u / 2u splits. |
| 6 | **Deskmat** | The carpet *is* the deskmat: camera drops to the floor and rises to reveal it as a full-bleed print with overlaid floor-plan lines. | Drag to pan the artwork, pinch/scroll-wheel to zoom for print detail; size selector (900×400 / 1200×500). |
| 7 | **Artisans** | A gallery wall of framed collaboration pieces, each lit by its own tube. | Click a frame → artisan name, edition size, material, a short rotating 3D model; "Notify me" per piece. |
| 8 | **Render lab** | A clean white-lit studio on `tile`, the one place the Backrooms drops away. | Choose a layout and add/remove kits; shows a render and a live total. This is where the collectors' decision happens. |
| 9 | **Pricing & vendors** | Fluorescent-lit reception desk: kit table at left, vendor list at right, sorted by region. | Region selector (NA / EU / UK / APAC / CA / AU) filters vendors; each row: name, region, GB window, `Open link`. Prices in mono, tabular. |
| 10 | **Exit** | Corridor ends at an unlit door; camera stops. Footer: timeline, FAQ, credits, newsletter. | Pressing `E` or clicking the door loops softly back to the Lobby. |

Persistent chrome: a minimal top bar (`Liminal / Kits / Vendors`), station index on the right edge as
tick marks (hairline; active tick turns `sick`), and the sound + light placards bottom-left.
Deep links per station (`#kits`, `#vendors`) work; scroll position restores on reload.

## 4. Technical Stack & Performance

| Concern | Choice | Why |
|---|---|---|
| Rendering | **Three.js (vanilla) + Vite** | Direct control over a scroll-driven rail; avoids React reconciliation cost on a scene that is mostly imperative. *R3F + drei is an acceptable alternative if the team already works in React.* |
| Scroll/anim | **Lenis + GSAP ScrollTrigger** | Industry standard for scrubbed camera rails; timelines stay declarative. |
| Shaders | Custom GLSL via `ShaderMaterial` | Procedural carpet, tube glow, fog, dust, legend emissive — **zero texture downloads** for the environment. |
| Post | `postprocessing` (pmndrs): bloom (tubes/legends only), SMAA, subtle tone-map | Selective bloom keeps cost low; no heavy DOF in real time (fake it with a blur shader at stations 5 and 8). |
| Assets | glTF, **Meshopt** + **KTX2/Basis**, one shared cap model, ~104 `InstancedMesh` instances | Whole keyboard = 1 draw call per material; target < 1.2 MB 3D payload. |
| Lighting | Baked AO/lightmap for corridors; 3–4 real lights max (tubes as RectAreaLights approximated by emissive + bloom) | Keeps GPU time stable on integrated graphics. |
| Audio | Web Audio API, preloaded 3 short loops + sprite sheet for key sounds | < 400 KB total, lazy-loaded after first interaction. |
| UI | Plain HTML/CSS over a fixed canvas; CSS variables for the tokens above | Fast, accessible, no UI framework needed. |

### Performance budget
- Critical path: **≤ 250 KB gz JS**, first meaningful paint (HTML+CSS hero poster) < 1.5s on 4G.
- Hero renders a static poster instantly; the WebGL scene fades in once ready (`LCP` is the poster).
- **Adaptive quality:** measure frame time for the first 60 frames; drop DPR (2→1.5→1), disable bloom,
  then reduce dust, in that order. Pause rendering when the tab is hidden or the canvas is off-screen.
- Target 60fps on a 2020 integrated GPU at 1080p; ≥ 30fps floor on mid-range phones.
- `prefers-reduced-motion`: disable flicker, camera drift and parallax; scroll jumps between stations.
- **No-WebGL / low-power fallback:** stacked pre-rendered stills with the same copy and tables, so the
  buying information is never gated behind the 3D experience.
- A11y: all kit/price/vendor data is real DOM text, keyboard navigable, with visible `sick` focus rings;
  canvas is `aria-hidden` with an equivalent text description per station.

## Execution Plan

1. **Foundation (repo):** archive the current page to `archive/` (matches prior commit practice),
   scaffold Vite + Three, set the design tokens, type system, and grid; build the HTML/CSS hero poster.
2. **Environment kit:** procedural carpet, ceiling, tube lights, fog, dust; camera spline + ScrollTrigger rail
   through stations 0–3; adaptive-quality loop.
3. **Hero asset:** modelled keycap (Cherry-style profile) with doubleshot legend inset; instanced
   keyboard layout; typing + light-switch interactions; sound bed and key sprites.
4. **Content stations 4–9:** novelties, deskmat, artisans, render lab, pricing/vendor tables
   (data-driven from `content/*.json` so real figures can be dropped in without touching code).
5. **Polish & QA:** reduced-motion + fallback path, a11y pass, perf profiling on target devices,
   Lighthouse (aim ≥ 90 performance, 100 a11y), cross-browser (Safari WebGL2/audio quirks).

## Critical files (once built)
- `index.html`, `css/tokens.css`, `css/layout.css` — tokens and grid
- `js/scene/` — `environment.js`, `keycaps.js`, `rail.js`, `quality.js`
- `js/shaders/` — `carpet.frag`, `tube.frag`, `fog.glsl`
- `js/audio.js`, `js/ui/stations.js`
- `content/kits.json`, `content/vendors.json`, `content/artisans.json`

## Verification
- Run `npm start` (or Vite dev) and walk the full scroll rail desktop + mobile viewport.
- Press keys in station 0/3: caps depress, legends light, sound plays only after opt-in.
- Toggle placards: sound, light cut, reduced motion; confirm each degrades gracefully.
- Throttle CPU 4× and a 3G profile in DevTools: adaptive quality kicks in; poster paints < 1.5s.
- Disable WebGL (`chrome://flags`): fallback stills + full tables render.
- Run Lighthouse and axe; confirm contrast of every token pair, focus order and landmark structure.
- Playwright smoke test (extends `tests/load.mjs`): page loads with no console errors, each station
  anchor scrolls into view, vendor region filter returns expected rows.

## Open questions to confirm before building
- Real kit contents, prices, vendor list and artisan names (placeholders until supplied).
- Whether to keep vanilla Three or use R3F (default: vanilla).
- Whether the existing dark-fantasy page should be archived or kept alongside.
