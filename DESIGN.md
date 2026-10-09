# CVLTSM: design

## The idea

A Nordic cult's ritual, found on damaged film. The site should feel like being shown something you were not meant to see: an archival recording, an underground film, the visual world of a black metal record. Not a product page with horror effects added.

The references set the terms: black, and one red. The red of dried blood, used as a duotone over the image, never as a fill. Small type set like the margin of a film slate. Torn edges. Grime that is real (concrete, film dust), not generated noise.

## Rules

- **Composition over effects.** A strong grid, wide negative space, few elements, each placed on purpose. Degradation sits over a clean structure, never instead of one.
- **No invented copy.** No taglines, eyebrows or marketing sentences. The identity comes from the logos, the footage and the composition. Text that appears states facts (set, keycaps, manufacturer, year) or belongs to the hunt.
- **No stand-in logos.** Until the artwork exists, its place is a dashed slot of the right proportions. Nothing is drawn or set in a font in its place.
- **Restraint in motion.** Slow dissolves; interference rarely and briefly; nothing flashing. Motion serves the film.

## Colour

- **Black** `#070605`, never pure. **Char** `#0f0c0a`, the colophon.
- **Bone** `#d4ccbf`: all type and hairlines. Dimmed bone (56%) for secondary type.
- **Dried blood** `rgb(122 28 20)`: a colour pass over the film at 32%, moving the grade's hue toward blood. It is the only red in the picture.
- **Ember** `#b1291f`: the hunt's glow and its focus line. Nowhere else.

## Type

- **Interface:** Inter Tight, weight 500, capitals at 11px with 8% tracking, for the nav, the reel, labels and the colophon. Small and exact, like a slate.
- **The manuscript and the hunt:** IM Fell English, a 17th-century face. Faint on the home page, large and legible on hunt pages. The first letter sits in a two-line drop with `initial-letter`.
- No gothic or blackletter: dark does not mean medieval-pastiche.

## Layout

- **Gutter** `clamp(20px, 3.2vw, 52px)`. Everything aligns to it.
- **The opening:** the film full bleed. The set's logo low on the left, about 56% of the width, where the eye settles; the manufacturer small at top left; the nav at top right; the reel at the foot on the right, opposite the logo. On phones the logo spans the width and the reel sits under it.
- **The manuscript:** two justified columns, max 1180px, on dark warm concrete with burned edges, its top torn.
- **The colophon:** four facts in a row, then the Speak field.

## The film's layers, bottom to top

poster frame; clip under; clip dissolving in; film damage (screen, 17%); concrete grime (multiply, 55%); blood (color, 32%); scratches; interference; shade (top and foot darkened for type, edges burned). Grain over the whole site at 8.5%.

## Motion

- Dissolve 2.4s, `cubic-bezier(0.4, 0, 0.2, 1)`. Interference 0.85s, in hard steps.
- Grain moves in six hard steps per 0.8s, by transform only. Scratches appear for a frame or two, three times in nine seconds.
- On scroll (CSS scroll timeline): the film scales to 1.06 and darkens to 45% as the manuscript rises; the logo and reel rise 14vh and fade.
- The hidden words of the manuscript heat like embers under the cursor and cool over seconds.
- Reduced motion: no autoplay, no grain or scratch movement, no scroll effects, no dissolves.
