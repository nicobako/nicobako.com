// Bow articulation: how the bow strokes, as opposed to how many notes it strokes at once.
//
// The bowing field says slur lengths. This one says what the bow *does* — détaché,
// martelé, staccato, spiccato, pizzicato — and it is a separate axis because the two are
// independent: a slur of two can be played portato or legato, and four separate bows can
// be détaché or martelé.
//
// **A symbol cannot name a stroke.** A dot means staccato on the string, spiccato off it,
// or sautillé faster still; martelé is written with dots, accents or hammer heads
// depending on the edition; détaché, collé and sautillé are often unmarked altogether.
// So a technique here declares two things: the decoration drawn on every note of a run,
// where the stroke has one, and the short instruction written *once* above the run, which
// is how a part actually tells a player which stroke is meant. Pizzicato also declares
// what to write when the bow comes back, which is `arco`.
//
// The codes are short words rather than single letters: twelve techniques outrun any
// mnemonic alphabet, and `s` already means "sixteenth" in the rhythm field.

import type { Preset } from "./preset.ts";

/** The abcjs decorations used here; all are in its own `Decorations` union. */
export type Mark = "staccato" | "tenuto" | "accent" | "marcato";

/** One bow stroke: what is drawn on each note, and what is written above the run. */
export interface Technique {
  /** The token typed in the articulation field — `mart`, `pizz`. */
  code: string;
  name: string;
  /** Drawn on every note of the run, for the strokes that have a symbol. */
  mark?: Mark;
  /** Written above the first note of each run, since the symbols are ambiguous. */
  instruction?: string;
  /** Written when leaving this technique — pizzicato's `arco`. */
  cancel?: string;
  /** False for pizzicato: a bow-direction mark is nonsense while it is in force. */
  bowed: boolean;
  description: string;
}

export const TECHNIQUES: Technique[] = [
  {
    code: "leg",
    name: "Legato",
    bowed: true,
    description:
      "Nothing written: the notes are as long as their values and the slur does whatever joining there is. The token to use inside a pattern to say “these ones plain”.",
  },
  {
    code: "det",
    name: "Détaché",
    instruction: "dét.",
    bowed: true,
    description:
      "A full, separate bow per note, the stroke everything else is a departure from. It has no symbol of its own, so the word is written above the run.",
  },
  {
    code: "ten",
    name: "Tenuto",
    mark: "tenuto",
    bowed: true,
    description:
      "A dash per note: hold each one its full length and change the bow without a gap. A symbol in its own right, so nothing is written in words.",
  },
  {
    code: "acc",
    name: "Accent",
    mark: "accent",
    bowed: true,
    description:
      "A sharper attack at the start of the note, with the note otherwise unchanged. Useful against a cycling pattern, where the accent lands somewhere new each lap.",
  },
  {
    code: "marc",
    name: "Marcato",
    mark: "marcato",
    bowed: true,
    description:
      "Marked: a stronger accent than the accent, shortening the note as well as attacking it.",
  },
  {
    code: "mart",
    name: "Martelé",
    mark: "accent",
    instruction: "mart.",
    bowed: true,
    description:
      "Hammered — the bow pinches the string, releases, and stops. Editions write it with dots, accents or hammer heads, so the word above the run is what actually says which stroke is meant.",
  },
  {
    code: "stac",
    name: "Staccato",
    mark: "staccato",
    bowed: true,
    description:
      "A dot per note, bow on the string: each note shortened and stopped. The plain reading of a dot, which is why no word is needed.",
  },
  {
    code: "spic",
    name: "Spiccato",
    mark: "staccato",
    instruction: "spicc.",
    bowed: true,
    description:
      "The same dot, but the bow leaves the string between notes. Only the word tells it apart from staccato.",
  },
  {
    code: "saut",
    name: "Sautillé",
    mark: "staccato",
    instruction: "saut.",
    bowed: true,
    description:
      "The same dot again, fast enough that the stick bounces on its own rather than being lifted. Print often omits the dots entirely and leaves it to the tempo.",
  },
  {
    code: "coll",
    name: "Collé",
    mark: "staccato",
    instruction: "collé",
    bowed: true,
    description:
      "Glued: set the bow on the string, pinch, and release so the note leaves cleanly. No symbol of its own, so the word carries it.",
  },
  {
    code: "port",
    name: "Louré (portato)",
    mark: "tenuto",
    instruction: "port.",
    bowed: true,
    description:
      "Gently pulsed notes within one bow — dashes under a slur. Pair it with a bowing of 2 or more, because the slur is what makes it portato rather than tenuto.",
  },
  {
    code: "pizz",
    name: "Pizzicato",
    instruction: "pizz.",
    cancel: "arco",
    bowed: false,
    description:
      "Plucked. The bow direction stops being marked while it is in force, and `arco` is written where the bow comes back.",
  },
];

export function techniqueFor(code: string): Technique | undefined {
  return TECHNIQUES.find((technique) => technique.code === code);
}

/** The codes, for an error message that has to list them. */
export const TECHNIQUE_CODES = TECHNIQUES.map((technique) => technique.code);

/**
 * Named patterns *of* those codes, which is what the builder's picker offers.
 *
 * The first is empty on purpose: an unmarked etude is the normal case, so it is a name in
 * the list rather than the absence of one.
 */
export const ARTICULATIONS: Preset[] = [
  {
    slug: "unmarked",
    name: "Unmarked",
    value: "",
    description:
      "Nothing written. The notes carry their bowing and nothing else, which is how most of these exercises are printed.",
  },
  {
    slug: "detache",
    name: "Détaché throughout",
    value: "det",
    description: "One word at the top and a full separate bow all the way down.",
  },
  {
    slug: "staccato",
    name: "Staccato throughout",
    value: "stac",
    description: "A dot on every note — shortened and stopped, bow staying on the string.",
  },
  {
    slug: "martele",
    name: "Martelé throughout",
    value: "mart",
    description: "Every note hammered. Slow enough to stop the bow between notes is the point.",
  },
  {
    slug: "spiccato",
    name: "Spiccato throughout",
    value: "spic",
    description: "Off the string on every note, which wants a moderate tempo and the lower half.",
  },
  {
    slug: "three-staccato-one-martele",
    name: "Three staccato, one martelé",
    value: "stac3 mart",
    description:
      "Four notes, and against a note pattern of any other length the hammered one lands somewhere new each lap — the same drift the rhythm and the bowing make.",
  },
  {
    slug: "pizzicato-and-arco",
    name: "Eight pizzicato, eight bowed",
    value: "pizz8 det8",
    description:
      "Alternating plucked and bowed bars, with `pizz.` and `arco` written where each one starts. Good for the right hand's two jobs in one exercise.",
  },
];
