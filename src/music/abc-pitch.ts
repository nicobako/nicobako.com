// Writing a pitch, and an accidental, the way ABC notation wants them.
//
// Both of the site's etude generators need the same four lines, and had their own copy
// of them: a note is a *diatonic index* — how many letters above written middle C it
// sits — which is all a white-key scale degree ever amounts to. Keeping one copy is what
// lets a mode, a root octave and an open string all be arithmetic on that one integer.
//
// Plain tables and arithmetic, so it resolves at build time and nothing reaches the
// browser except where a page deliberately imports it.

/** Semitones above C for the natural letters, and the letters themselves. */
export const NATURAL_OFFSETS = [0, 2, 4, 5, 7, 9, 11] as const;
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;

/**
 * The letter and octave marks for a note `index` letters above written middle C,
 * negative below it. `C` is middle C; higher octaves go lowercase and then take
 * apostrophes, lower ones take commas.
 *
 * Floor division so the octave rolls over correctly below middle C, where `index` is
 * negative and `%` alone would give a negative letter.
 */
export function abcPitch(index: number): string {
  const octave = 4 + Math.floor(index / 7);
  const letter = LETTERS[index - (octave - 4) * 7]!;
  if (octave >= 5) return letter.toLowerCase() + "'".repeat(octave - 5);
  return letter + ",".repeat(4 - octave);
}

/** The ABC accidental that moves a letter by `alteration` semitones. */
export function accidentalMark(alteration: number): string {
  if (alteration <= -2) return "__";
  if (alteration === -1) return "_";
  if (alteration === 0) return "=";
  if (alteration === 1) return "^";
  return "^^";
}
