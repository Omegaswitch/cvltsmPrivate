# The hunt (spoilers)

Six riddles. The first two belong to the set itself. The four after them reach into the Norse material the set is built on, and each is made so that the answer has to be **found**: read off a drawing, gathered from other people, or waited for. A chatbot can tell you about the Rök stone. It cannot see the staves on this page, hold the other three fragments, or be there at night.

| # | Page | Riddle | Answer |
|---|------|--------|--------|
| 0 | home | The manuscript below the film. Its glowing words read: pressed, never broken, struck, never bleeding, carry the mark, Name. | `key` (or `keycap`) |
| 1 | `/rite/ae3f9c71b2` | Two pours, one body; the legend poured in a second time. | `double shot` |
| 2 | `/rite/444cce3874` | Five staves in the twig runes of the Rök stone. | `Vámóðr` (also `vamodr`, `vamod`, `uamuth`) |
| 3 | `/rite/6f294ec0f7` | Four fragments, one per visitor. | `Yggr` |
| 4 | `/rite/8ece93fb04` | One line by day, another by night. | `Sköll Hati` (also `Skoll and Hati`) |
| 5 | `/rite/5d02b8e4c6` | The colour of what has dried. | `dried blood` |
| 6 | `/rite/c917a6f04d` | The end. | |

## 2. The stone

The Rök runestone (Östergötland, c. 800) hides part of its text in cipher runes. In the twig runes, a stem carries branches on the left that count the **ætt**, the family the rune belongs to (the Younger Futhark has three), and branches on the right that count the rune's place in it. On Rök the families are numbered backwards: Týr's ætt is 1 and Freyr's is 3.

| Ætt on Rök | Runes |
|---|---|
| 1, Týr's | t b m l R |
| 2, Hagal's | h n i a s |
| 3, Freyr's | f u þ ą r k |

The page draws (left, right): (3,2) u, (2,4) a, (1,3) m, (3,2) u, (3,3) þ, so the staves read **uamuþ**. The stone opens *aft uamuþ stanta runaR þaR*, "in memory of Vámóðr stand these runes": the first name it remembers is Vámóðr, Varinn's son.

The reader needs to recognise a cipher system from a drawing, find the ætt order of the Younger Futhark, and know that Rök swaps it. The page never says "Rök"; it says Östergötland, a stone and eleven hundred years.

## 3. The fragments

The page is the same for everyone except one line. The first right answer draws a seed (0 to 9999), signed into the cookie and kept for good, and the seed picks one of four fragments:

1. From his blood the sea, from his bones the hills, from his skull the sky. **Y**mir
2. Before anything, the gap that yawned between the fire and the ice. **G**innungagap
3. His spear, which never misses. **G**ungnir
4. He runs up and down the tree, carrying insults between the eagle and the serpent. **R**atatoskr

Their first letters spell **Yggr**, "the terrible one", a name of Odin (as in Yggdrasil, Yggr's horse). The idea comes from I Love Bees and Cicada 3301, where clues were split so that no one person could finish alone. A visitor on their own can still get there: a fresh browser draws a new seed, and one fragment plus "his names" narrows it a long way. But the hunt rewards people who talk to each other, which is the point of a community around a keycap set.

## 4. The hours

The page shows one line by day (06:00 to 17:59 in Stockholm) and another by night:

- Day: the one who runs behind the sun and will catch it at the end; his name means treachery. **Sköll**
- Night: the one who runs behind the moon; his name means hatred. **Hati**

"Speak both names, the day's first": **Sköll Hati**. Whoever reads the page once sees only half of it. Time-gated clues are an old ARG device (the I Love Bees payphones rang at set times).

## Why these, and what it does not stop

- Text-only riddles about well-known facts fall to a chatbot in seconds. These put the clue somewhere a model is not: in a drawing that has to be counted, in other people's browsers, or in a different hour.
- Someone can still screenshot the stone and ask a model to read it, or share all four fragments in one post. That is fine: sharing *is* the intended way through stage 3. What the server guarantees is that nobody can skip ahead by reading files, guessing addresses or forging the cookie.
- Answers are hashed but short, so anyone with the source could brute-force them. Keep the repository private.

## Sources

- [Rök runestone](https://en.wikipedia.org/wiki/R%C3%B6k_runestone) and [Cipher runes](https://en.wikipedia.org/wiki/Cipher_rune)
- [Runforum, Uppsala: cryptic runes](https://www.runforum.nordiska.uu.se/blog/cryptic-runes)
- [Klaus Schmeh: Magnus Ekhall's trip to the Rök runestone](https://scienceblogs.de/klausis-krypto-kolumne/2019/05/05/magnus-ekhalls-trip-to-the-roek-runestone/)
- [Cicada 3301](https://en.wikipedia.org/wiki/Cicada_3301) and [the Liber Primus guide](https://www.boxentriq.com/guides/cicada-3301-liber-primus)
- [ARGN on the I Love Bees payphones](https://www.argn.com/tag/payphones/)
- [Puzzle hunt](https://en.wikipedia.org/wiki/Puzzle_hunt)
- [University of Washington: a puzzle game that shows kids they are smarter than AI](https://www.washington.edu/news/2025/07/01/this-puzzle-game-shows-kids-how-theyre-smarter-than-ai/)
- [The puzzling failure of multimodal AI chatbots](https://medium.com/@chiayewken/the-puzzling-failure-of-multimodal-ai-chatbots-678297b85529)
