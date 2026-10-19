// How abcjs spells a key, and nothing else.
//
// This lives on its own because two unrelated features depend on agreeing with abcjs's
// choices: the single-octave scales name their pages after a tonic, and the etude model
// labels a transposition with the key signature the reader will actually see.

import type { Spelling } from "./pitch.ts";

/**
 * How abcjs spells each tonic, indexed by semitone above C.
 *
 * These are not our preference — they mirror what abcjs actually renders, so that a page
 * titled "D#4" shows a D# on the staff. abcjs decides the key signature from a fixed
 * internal table that cannot be configured, and the two modes disagree on exactly three
 * pitch classes: 1 (Db/C#), 3 (Eb/D#) and 8 (Ab/G#). Every name below is an accepted
 * spelling on the circle of fifths, so following abcjs costs nothing musically.
 *
 * If abcjs is ever upgraded, re-verify these against `parseOnly(...).getKeySignature()`
 * before trusting them.
 */
export const TONIC_SPELLINGS: Record<"major" | "minor", Spelling> = {
  major: ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"],
  minor: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "Bb", "B"],
};

/** The pitch class of `semitones`, as an index into a `Spelling`. */
export function pitchClass(semitones: number): number {
  return ((semitones % 12) + 12) % 12;
}
