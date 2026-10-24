/*
 * Field Station 7, Svartskog: the files on the station's machine. Server only
 * (the API route reads it); nothing here is sent to a visitor until their pass
 * allows it.
 *
 * `level` is the clearance a file needs to be read. A file is listed from
 * `shown` (default 0) whether or not it can be read yet, so a locked file is
 * itself a clue. `lock` names the lock that opens it; the answers live in
 * LOCKS as hashes (lib/station/pass.ts).
 *
 * The chain, for whoever maintains this (keep it out of anything public):
 *   1  stone   the inscription on stone 7, read with the runes.  ULFHEDNAR
 *   2  date    the first anomaly: three nights before the 1987
 *              winter solstice (22 Dec).                         19 DEC 1987
 *   3  carrier the hum: seven stones x twenty-nine nights.      203
 *   4  admin   director's first name (acrostic of the
 *              transcript) and the word the voices repeat.      asgeir / vargr
 */

export type Lock = 'stone' | 'date' | 'carrier' | 'admin';

/** lock -> the level it grants, the level it needs, and the accepted answers' hashes */
export const LOCKS: Record<Lock, { from: number; to: number; answers: string[] }> = {
  stone: { from: 0, to: 1, answers: ['05560d3b97260f0b0530b31122c1e3aa4d9fbd39ea3d50ebc3bcfd657895814c'] },
  date: {
    from: 1,
    to: 2,
    answers: [
      'e8d7fe0bfd4c1517c02c8e34bb67316a587d740f71b81cd6ac0bc543ccd72822',
      '7236ab9dc7753d5018cfe3adf00b815169ed26b720031e61fc83707e021367e9',
      'c0e91ab03cb5b9dce66ebafffd4db9d4d54c013e3ff9ab85429b4edbd0acf924',
    ],
  },
  carrier: { from: 2, to: 3, answers: ['7da09ded6a00e149cea9619fa95b25c406e0136f9ef62e8aeb9f7986cb28128f'] },
  admin: { from: 3, to: 4, answers: ['06bb80f23c0d075b55c2a25c1619c1fc863ae0222eee217e346d1707b98efd17'] },
};

/** What a stuck visitor is told, by level. Nudges, never answers. */
export const HINTS = [
  'Stone 7 carries a word. Stones 3 and 5 carry names you already know. The row on stone 1 is the order they were cut in. Try: runes',
  'The journal gives a night, not a date. Count back from the longest night of 1987. Then: decrypt anomaly_01.log <ddmmyyyy>',
  'The carrier never drifts. Read anomaly_01.log for the sum, then: tune',
  'Account names are first names, lower case (personnel.txt). Read the transcript down its left edge. The voices answer with a word in runes. Then: login <name>',
  'You have everything she left. Read slowly.',
];

type File = { name: string; level: number; shown?: number; lock?: Lock; body: string };

export const FILES: File[] = [
  {
    name: 'readme.txt',
    level: 0,
    body: `FIELD STATION 7 / SVARTSKOG
Norwegian Institute for Geophysics and Folk Memory (NIGF)
Terminal access: guest

This machine holds the working files of Dr. Ingrid Halvorsen,
resident observer, case CVLTSM (from 1987).

The station has been unmanned since 4 February 1988.
Files above guest clearance are sealed. They open to the
keys she used; she wrote most of them down somewhere.

  help        what this terminal understands
  ls          the files you can see
  cat <file>  read a file
  hint        when you are lost`,
  },
  {
    name: 'personnel.txt',
    level: 0,
    body: `FIELD STATION 7 / PERSONNEL (1987)

  I. Halvorsen     resident observer        account: ingrid
  A. -             station director         account: (sealed)
  T. Brekke        radio, instruments       account: tor   (left Sept.)

Accounts are first names, lower case.
The director's account holds the station's administrative files.
The director has not logged in since December.`,
  },
  {
    name: 'equipment.log',
    level: 0,
    body: `EQUIPMENT / INSTALLATION LOG

1987-06-02  station opened. generator, radio mast, 2 magnetometers.
1987-06-09  seismic array laid in the ring (7 stones, 7 sensors).
1987-07-30  receiver tuned to the forest band for interference checks.
1987-09-14  T. Brekke leaves. "the radio sings at night." not logged as fault.
1987-11-02  magnetometer B replaced. reading inverted (needle points into the ring).
1987-12-..  ALL CHANNELS SATURATED 02:14 - 05:51. (page torn) see anomaly_01.log, sealed.
1988-02-04  last generator log. station unmanned.`,
  },
  {
    name: 'journal_01.txt',
    level: 0,
    body: `JOURNAL / I. HALVORSEN / 14 AUGUST 1987

The locals do not say the name. When they must, they say
"kultsamfunnet", the cult-fellowship, and look at the trees.
I have been writing CVLTSM on the folders, as a case code.

They are real. I saw four of them tonight at the edge of the
clearing: hooded, the faces covered, one wearing horns. They
walked the ring of stones without speaking and left before
the light changed. I did not follow.

There is a face at the cabin window most nights now. Behind
the wire. It does not move when I do.`,
  },
  {
    name: 'journal_02.txt',
    level: 0,
    body: `JOURNAL / I. HALVORSEN / 3 SEPTEMBER 1987

Seven stones in the ring, each carved. Old futhark, the
twenty-four signs. I have numbered the stones from the
north, clockwise.

Stone 1 carries the whole row, as the carvers ordered it,
in three rows of eight. I copied it exactly:

  ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ
  ᚺ ᚾ ᛁ ᛃ ᛇ ᛈ ᛉ ᛊ
  ᛏ ᛒ ᛖ ᛗ ᛚ ᛜ ᛞ ᛟ

Stone 3 is easy, a god:  ᛟ ᛞ ᛁ ᚾ   (ODIN)
Stone 5 too:             ᚦ ᛟ ᚱ       (THOR, the first sign is TH)

The signs I am sure of, from my school book:
  ᚠ F   ᚢ U   ᚺ H   ᛖ E   ᚾ N   ᚨ A

Stone 7 is different. Fresh cuts, this year's. See stone_07.txt.`,
  },
  {
    name: 'stone_07.txt',
    level: 0,
    body: `STONE 7 / TRANSCRIPTION / I. H.

  ᚢ ᛚ ᚠ ᚺ ᛖ ᛞ ᚾ ᚨ ᚱ

Nine signs, one word. I think it is what they call themselves.
The old woman at the shop crossed herself when I showed her.

I have locked the rest of my notes (journal_04.enc) under that
word. If you can read the stone you can read me.

  runes                       to work it out on the screen
  decrypt journal_04.enc <word>`,
  },
  {
    name: 'journal_03.txt',
    level: 0,
    body: `JOURNAL / I. HALVORSEN / 11 OCTOBER 1987

The instruments hum. Not the generator: a carrier, steady,
on the forest band, strongest at the ring. Brekke heard it
before he left. He said it sang.

Magnetometer B now points into the ring, whatever way I
turn it. Frost on the stones in the morning and nowhere else.

A. says to keep recording and stop walking out at night.
A. walks out at night.`,
  },
  {
    name: 'journal_04.enc',
    level: 1,
    lock: 'stone',
    body: `JOURNAL / I. HALVORSEN / NOVEMBER - DECEMBER 1987

They call themselves ULFHEDNAR: the wolf-coats. The old word
for the ones who went into battle as wolves. I was wrong to
think it was only a word.

They are preparing for the longest night. Everything they do
now is counted toward it. The fires in the clearing have
moved closer to the cabin each week.

The radio died three nights before the longest night. That
was the night it began: every instrument at once. I have
sealed the readings from that night under its date.

  decrypt anomaly_01.log <ddmmyyyy>

A. was not in the station that night. A.'s coat was on the
hook in the morning, wet to the shoulder, and smelled of
smoke.`,
  },
  {
    name: 'anomaly_01.log',
    level: 2,
    lock: 'date',
    body: `ANOMALY 01 / 19 DECEMBER 1987 / ALL CHANNELS

02:14  magnetometer A  +38000 nT, holding. B inverted.
02:14  seismic 1-7     synchronous pulse, 1.06 s period.
02:31  thermal         ring interior -31 C. exterior -9 C.
02:40  receiver        carrier on the forest band. no drift.
03:05  camera 2        figures in the ring. count varies 7 / 9 / 7.
03:57  clock           station clock loses 41 minutes. wristwatch agrees.
05:51  all channels    return to baseline.

Note (I. H.): the carrier never drifts. Seven stones,
twenty-nine nights of the moon: multiply, and you are on it.
The voices on it are in transcript.txt. I could not listen
twice.

  tune                to find it on the receiver`,
  },
  {
    name: 'transcript.txt',
    level: 3,
    lock: 'carrier',
    body: `TRANSCRIPT / RECEIVER / 203 kHz / 19-20 DECEMBER 1987

Fragments. Several voices, then one. Norwegian, older words
mixed in. My translation, line by line.

  All of the ring is open now.
  Seven walk it, and the seventh is a stranger.
  Give the forest what was promised at midsummer.
  Each coat is taken from a wolf that chose it.
  In the long night the door does not close.
  Remember who carried the fire to the cabin.

Then, many times, one word, which I have written as it
was cut into the frost on the window this morning:

  ᚹ ᚨ ᚱ ᚷ ᚱ

The director's account is sealed. I think I know whose it is.

  login <name>`,
  },

  // administrative files: the director's account
  {
    name: 'admin/encounters.txt',
    level: 4,
    shown: 4,
    body: `ADMIN / ENCOUNTERS (compiled from I. H.'s reports)

E1  14 AUG  the face behind the wire at the cabin window.
            present most nights. does not move. no tracks below.
E2  30 AUG  hands on the frosted glass of the radio room.
            from inside the glass. prints did not wipe off.
E3  22 SEP  a hooded figure in the mist of the court, carrying
            a scythe. walked through the closed gate.
E4  02 NOV  a shape on four legs that stood up. antlered.
            seen against the fire at the old hut. taller than the hut.
E5  19 DEC  the horned one before the fire, the others around him
            with shields. riders with torches on the ridge road.
E6  04 FEB  the cabin. last entry. see admin/last_entry.txt.`,
  },
  {
    name: 'admin/anomalies.txt',
    level: 4,
    shown: 4,
    body: `ADMIN / MAGICAL ANOMALIES (station classification)

A1  INVERSION     magnetometers point into the ring from any bearing.
                  persistent since Nov. 1987.
A2  COLD          the ring interior is 20 degrees colder than the
                  forest around it, in every season.
A3  CARRIER       a steady signal at 203 kHz with no transmitter.
                  carries voices. strongest at the solstices.
A4  LOST TIME     41 minutes lost on 19 Dec., station-wide.
                  repeated on 4 Feb. (unmeasured: clock stopped).
A5  COUNT         the figures in the ring are seven or nine,
                  depending on who counts. cameras disagree.
A6  FROST WRITING runes cut into frost on glass, from inside.
                  ᚹᚨᚱᚷᚱ (vargr: wolf, outlaw). recurring.`,
  },
  {
    name: 'admin/director.txt',
    level: 4,
    shown: 4,
    body: `ADMIN / ACCOUNT asgeir / A. VOLD, STATION DIRECTOR

If you are reading this you found my name the way she did.

I did not bring the ring to the station. The station was put
on the ring, by people who knew what it was. I was sent to
keep it quiet and to keep it listening.

She was never in danger from them. She was in danger from
counting. They let her count. The seventh who walks the ring
is always a stranger. Midsummer, I promised them one.

I have kept her files as she left them.`,
  },
  {
    name: 'admin/last_entry.txt',
    level: 4,
    shown: 4,
    body: `JOURNAL / I. HALVORSEN / 4 FEBRUARY 1988

The fire is at the cabin. They are not hiding now. Riders on
the ridge, torches, the horned one in front. The face at the
window has moved for the first time. It is smiling.

I have sealed everything under the keys they gave me. Whoever
comes after me will have to read the stones, count the nights,
find the carrier and say the director's name, the way I did.
That is the only way through: the way they made me walk.

The clock has stopped. I am going out to the ring.

If it comes back, it will be in 2027.`,
  },
];
