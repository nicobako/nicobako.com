// The instruments an etude can be written for.
//
// What actually differs between them is small, which is why this is a table and not a
// subsystem: the clef the music is drawn in, the octave it is written in, and the four
// notes the open strings sound. The clef is pure presentation — in ABC a letter names an
// absolute pitch whatever clef is in force, so `clef=alto` draws the same notes lower on
// the staff and changes nothing about the arithmetic or the playback. The register is the
// etude's `rootOctave`, which an instrument only supplies a sensible default for.

/** Tenor clef is a real gap for cello; it is one more entry here when a study needs it. */
export type ClefSlug = "treble" | "alto" | "bass";

export interface Instrument {
  slug: string;
  name: string;
  clef: ClefSlug;
  /** The root octave an etude on this instrument starts from, in scientific pitch. */
  rootOctave: number;
  /** Open strings, low to high. */
  strings: string[];
  /** The lowest and a generously high note, in semitones from middle C. */
  lowest: number;
  highest: number;
  description: string;
}

export const INSTRUMENTS: Instrument[] = [
  {
    slug: "violin",
    name: "Violin",
    clef: "treble",
    rootOctave: 4,
    strings: ["G3", "D4", "A4", "E5"],
    lowest: -5,
    highest: 40,
    description:
      "Treble clef, written from middle C up. The open strings are a fifth apart, so a scale rooted on one of them is the same shape on all four.",
  },
  {
    slug: "viola",
    name: "Viola",
    clef: "alto",
    rootOctave: 3,
    strings: ["C3", "G3", "D4", "A4"],
    lowest: -12,
    highest: 33,
    description:
      "Alto clef, a fifth below the violin and written an octave lower. The same note pattern as a violin study, read on the middle-C line instead.",
  },
  {
    slug: "cello",
    name: "Cello",
    clef: "bass",
    rootOctave: 2,
    strings: ["C2", "G2", "D3", "A3"],
    lowest: -24,
    highest: 24,
    description:
      "Bass clef, an octave below the viola. Real cello writing changes clef mid-piece for the high register; these studies stay in bass clef and so stay low.",
  },
];

export function instrumentFor(slug: string): Instrument {
  const instrument = INSTRUMENTS.find((candidate) => candidate.slug === slug);
  if (!instrument) throw new Error(`Unknown instrument "${slug}"`);
  return instrument;
}

/** The instrument a clef and root octave came from, for describing an etude. */
export function instrumentMatching(clef: ClefSlug, rootOctave: number): Instrument | undefined {
  return INSTRUMENTS.find(
    (candidate) => candidate.clef === clef && candidate.rootOctave === rootOctave,
  );
}
