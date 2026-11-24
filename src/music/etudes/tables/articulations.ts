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
// mnemonic alphabet, and `s` already means "sixteenth" in the rhythm field. They are
// what the articulation lane's keys are labelled from.

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
}

export const TECHNIQUES: Technique[] = [
  {
    code: "leg",
    name: "Legato",
    bowed: true,
  },
  {
    code: "det",
    name: "Détaché",
    instruction: "dét.",
    bowed: true,
  },
  {
    code: "ten",
    name: "Tenuto",
    mark: "tenuto",
    bowed: true,
  },
  {
    code: "acc",
    name: "Accent",
    mark: "accent",
    bowed: true,
  },
  {
    code: "marc",
    name: "Marcato",
    mark: "marcato",
    bowed: true,
  },
  {
    code: "mart",
    name: "Martelé",
    mark: "accent",
    instruction: "mart.",
    bowed: true,
  },
  {
    code: "stac",
    name: "Staccato",
    mark: "staccato",
    bowed: true,
  },
  {
    code: "spic",
    name: "Spiccato",
    mark: "staccato",
    instruction: "spicc.",
    bowed: true,
  },
  {
    code: "saut",
    name: "Sautillé",
    mark: "staccato",
    instruction: "saut.",
    bowed: true,
  },
  {
    code: "coll",
    name: "Collé",
    mark: "staccato",
    instruction: "collé",
    bowed: true,
  },
  {
    code: "port",
    name: "Louré (portato)",
    mark: "tenuto",
    instruction: "port.",
    bowed: true,
  },
  {
    code: "pizz",
    name: "Pizzicato",
    instruction: "pizz.",
    cancel: "arco",
    bowed: false,
  },
];

export function techniqueFor(code: string): Technique | undefined {
  return TECHNIQUES.find((technique) => technique.code === code);
}

/** The codes, for an error message that has to list them. */
export const TECHNIQUE_CODES = TECHNIQUES.map((technique) => technique.code);
