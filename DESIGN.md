# CVLTSM: design

## The idea

A Nordic cult's ritual, found on damaged film. The site should feel like being shown something you were not meant to see: an archival recording, an underground film, the visual world of a black metal record. Not a product page with horror effects added.

The references set the terms: black, and one red. The red of dried blood, used as a duotone over the image, never as a fill. Small type set like the margin of a film slate. Torn edges. Grime that is real (concrete, film dust), not generated noise.

## Rules

- **Composition over effects.** A strong grid, wide negative space, few elements, each placed on purpose. Degradation sits over a clean structure, never instead of one.
- **No invented copy.** No taglines, eyebrows or marketing sentences. The identity comes from the logos, the footage and the composition. Text that appears states facts (set, keycaps, manufacturer, year).
- **No stand-in logos.** Until the artwork exists, its place is a dashed slot of the right proportions. Nothing is drawn or set in a font in its place.
- **Restraint in motion.** Slow dissolves; interference rarely and briefly; nothing flashing. Motion serves the film.

## Colour

- **Black** `#070605`, never pure. **Char** `#0f0c0a`, the colophon.
- **Bone** `#d4ccbf`: all type and hairlines. Dimmed bone (56%) for secondary type.
- **Dried blood** `rgb(122 28 20)`: a colour pass over the film at 32%, moving the grade's hue toward blood. It is the only red in the picture.

## Type

- **Faith Collapsing** (`public/fonts/`, a ruined blackletter) for everything the visitor reads as a heading or a button: the nav, section titles (up to 9rem), kit names, vendor regions, the sound control and the hover. Never for running text.
- **Interface:** Inter Tight for the small labels of the colophon and the body of the privacy policy. Small and exact, like a slate.
- No gothic or blackletter: dark does not mean medieval-pastiche.

## Layout

- **Gutter** `clamp(20px, 3.2vw, 52px)`. Everything aligns to it.
- **The opening:** the film full bleed. The set's logo low on the left, about 56% of the width, where the eye settles; the manufacturer small at top left; the nav at top right; the reel at the foot on the right, opposite the logo. On phones the logo spans the width and the reel sits under it.
- **Kits:** on dark concrete, its top torn, coming up over the film. Square renders: the base kit at 7 of 12 columns, the numpad at 4 set low on the right, the novelties at 4 in the middle below. Each kit drifts at its own depth, name and all.
- **Colors:** pinned beneath the kits on black, uncovered as the kits' torn bottom edge scrolls away; four equal chips (Alphas base #565050, Red #A80800, Dark brown #2A2624, Cyan #B1BEC3), with name and hex.
- **Renders:** on concrete, torn over the colors; square renders on an uneven 12-column grid (7 columns, 4 set low beside it, then three of 4), each drifting at its own depth.
- **Vendors:** on black, torn over the renders; regions in a ruled list.
- **Colophon:** four facts in a row (set, keycaps, manufacturer SWG, year 2027).

## The film's layers, bottom to top

poster frame; clip under; clip dissolving in; film damage (screen, 17%); concrete grime (multiply, 55%); blood (color, 32%); scratches; interference; shade (top and foot darkened for type, edges burned). Grain over the whole site at 8.5%.

## Motion

- Dissolve 2.4s, `cubic-bezier(0.4, 0, 0.2, 1)`. Interference 0.85s, in hard steps.
- Grain moves in six hard steps per 0.8s, by transform only. Scratches appear for a frame or two, three times in nine seconds.
- On scroll (CSS scroll timeline): the film scales to 1.06 and darkens as the kits rise; the logo and reel rise and fade. Kit renders drift against the scroll by 3 to 12vh. The colour chips rise in as the kits leave.
- The film's grime and dust pulse (two beats and a rest, 5.2s), and the picture glitches briefly every 7.7s.
- Hover: blood dragged across in one stroke, fast then slowing (0.7s), running down in drips with beads at their ends; then the word in Faith Collapsing rising out of it, glowing hot, its own paint running down off the letters (1.1s, after 0.32s).
- Reduced motion: no autoplay, no grain or scratch movement, no scroll effects, no dissolves.

## Sound

One ambient track, a seamless loop, at half level. It starts on the visitor's first click or key, fades in over 3 seconds, and the small control at the foot on the right (daubed on hover like the nav) turns it off. Off is remembered. Never autoplays, never plays in a hidden tab.
