// Scale degrees, the seven diatonic modes, and the keys they can be played in.
//
// A mode here is a *rotation* of one parent scale rather than a set of intervals over a
// fixed tonic. One parent is always written — C, no accidentals — and the mode decides
// which letter degree 1 sits on: Ionian starts on C, Dorian on D, Aeolian on A. That is
// what a mode is to a player working through them, and it has a happy consequence for
// this code: every unaltered degree is a white key, so there is no table of semitone
// offsets per mode and no key signature to write. An accidental appears only where the
// note itself asks for one.
//
// Two things the mode does *not* decide. Which octave the etude is written in is the
// etude's own `rootOctave`, because rotations would otherwise drift the register by an
// eleventh between Ionian and Locrian and a cello study needs to say "two" out loud.
// And which key it sounds in is a pitch offset handed to abcjs as `visualTranspose`,
// exactly as the single-octave scales do it — so the key picks a pitch *class* only and
// never argues with the root octave.
//
// Tables and arithmetic: all of this resolves at build time.

import { TONIC_SPELLINGS, pitchClass } from "../abc-key.ts";
import { NATURAL_OFFSETS } from "../abc-pitch.ts";

export type ModeSlug =
  | "ionian"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "aeolian"
  | "locrian";

export interface Mode {
  slug: ModeSlug;
  /** Label shown to the reader. */
  name: string;
  /** How many letters above C degree 1 sits: Ionian 0, Dorian 1, … Locrian 6. */
  rotation: number;
  /** One or two lines on what the mode sounds like and where it is met. */
  description: string;
}

export const MODES: Mode[] = [
  {
    slug: "ionian",
    name: "Ionian",
    rotation: 0,
    description:
      "The major scale. Written on C, it is the white keys from C to C, and it is the mode every other one here is measured against.",
  },
  {
    slug: "dorian",
    name: "Dorian",
    rotation: 1,
    description:
      "Minor with a raised sixth — the white keys from D. Brighter than natural minor without leaving it, which is why so much folk and modal jazz lives here.",
  },
  {
    slug: "phrygian",
    name: "Phrygian",
    rotation: 2,
    description:
      "Minor with a flattened second, the white keys from E. The half step straight above the tonic is the whole character of it.",
  },
  {
    slug: "lydian",
    name: "Lydian",
    rotation: 3,
    description:
      "Major with a raised fourth, the white keys from F. The tritone above the tonic makes it the most open-sounding of the major modes.",
  },
  {
    slug: "mixolydian",
    name: "Mixolydian",
    rotation: 4,
    description:
      "Major with a flattened seventh, the white keys from G. No leading note pulling home, so it sits still rather than resolving.",
  },
  {
    slug: "aeolian",
    name: "Aeolian",
    rotation: 5,
    description:
      "Natural minor, the white keys from A. Writing #7 in the notes gives harmonic minor, and #6 #7 gives the ascending melodic form, at exactly the notes you mean them.",
  },
  {
    slug: "locrian",
    name: "Locrian",
    rotation: 6,
    description:
      "A flattened second and a flattened fifth, the white keys from B. The tonic is a diminished chord, so it is studied more often than it is played.",
  },
];

export function modeFor(slug: string): Mode {
  const mode = MODES.find((candidate) => candidate.slug === slug);
  if (!mode) throw new Error(`Unknown mode "${slug}"`);
  return mode;
}

/**
 * How many letters above written middle C a degree sits, before the root octave is
 * added. `octaveShift` is the note's own `'`/`,` marks.
 */
export function degreeIndex(mode: Mode, degree: number, octaveShift: number): number {
  return mode.rotation + (degree - 1) + 7 * octaveShift;
}

/** Semitones above written C4 that this mode's degree 1 sits on. */
export function tonicSemitones(mode: Mode): number {
  return NATURAL_OFFSETS[mode.rotation]!;
}

/**
 * The same transposition, expressed as the smallest shift that reaches it: `[-6, 5]`.
 * Octaves are the root octave's business, so a key never moves the register.
 */
export function normaliseOffset(raw: number): number {
  return (((raw + 6) % 12) + 12) % 12 - 6;
}

/** The transposition that puts this mode's tonic on `soundingPitchClass`. */
export function offsetForTonic(mode: Mode, soundingPitchClass: number): number {
  return normaliseOffset(soundingPitchClass - tonicSemitones(mode));
}

const MAJOR_SEMITONES = [0, 2, 4, 5, 7, 9, 11] as const;
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;

/**
 * The seven letters of the major scale on `root`, spelled the way a key signature
 * spells them — one letter each, accidentals as needed. `Eb` gives Eb F G Ab Bb C D.
 */
function majorScaleNames(root: string): string[] {
  const letterIndex = LETTERS.indexOf(root[0] as (typeof LETTERS)[number]);
  const rootAlteration = (root.match(/#/g)?.length ?? 0) - (root.match(/b/g)?.length ?? 0);
  const rootSemitones = NATURAL_OFFSETS[letterIndex]! + rootAlteration;

  return MAJOR_SEMITONES.map((step, degree) => {
    const index = (letterIndex + degree) % 7;
    const wanted = rootSemitones + step;
    // Against the letter's natural pitch, and folded to the nearest octave so the
    // answer is an accidental rather than a leap.
    const alteration = normaliseOffset(wanted - NATURAL_OFFSETS[index]!);
    const mark = alteration >= 0 ? "#".repeat(alteration) : "b".repeat(-alteration);
    return LETTERS[index]! + mark;
  });
}

/** One key an etude can be played in: a transposition, and what the reader will see. */
export interface Key {
  /** Semitones handed to abcjs as `visualTranspose`. */
  offset: number;
  /** The mode's own tonic, spelled as the printed signature spells it — `C`. */
  tonicName: string;
  /** The major key abcjs prints the signature of — `Eb`. */
  parentName: string;
  /** `C Aeolian`. */
  label: string;
}

/**
 * Every key, per mode, resolved at build time.
 *
 * The tune is always written `K:C`, so the signature abcjs prints is the *parent major*
 * at this offset — and the mode's tonic is that major scale's letters indexed by the
 * rotation. Deriving the label this way rather than naming the tonic directly is what
 * guarantees the page and the staff agree: both come from abcjs's own spelling table.
 */
export const KEYS: Record<ModeSlug, Key[]> = Object.fromEntries(
  MODES.map((mode) => [
    mode.slug,
    Array.from({ length: 12 }, (_, i) => {
      const offset = i - 6;
      const parentName = TONIC_SPELLINGS.major[pitchClass(offset)]!;
      const tonicName = majorScaleNames(parentName)[mode.rotation]!;
      return { offset, tonicName, parentName, label: `${tonicName} ${mode.name}` };
    }),
  ]),
) as Record<ModeSlug, Key[]>;

export function keyFor(mode: Mode, offset: number): Key {
  const key = KEYS[mode.slug].find((candidate) => candidate.offset === normaliseOffset(offset));
  if (!key) throw new Error(`No key at offset ${offset}`);
  return key;
}

/** The mode's seven degrees as written letters, for the modes reference page. */
export function degreeLetters(mode: Mode): string[] {
  return Array.from({ length: 7 }, (_, i) => LETTERS[(mode.rotation + i) % 7]!);
}
