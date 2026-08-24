// Absolute pitches, built from a caller-supplied spelling.
//
// Everything here is a plain table plus arithmetic, so it resolves at build time and
// nothing in it reaches the browser. It exists so that music features can talk about a
// concrete note — "A3", "D#4" — rather than a scale degree, and convert that to the
// number of semitones abcjs needs for `visualTranspose`.
//
// The *spelling* of the black keys is deliberately not decided here. Whether a pitch is
// called Eb or D# depends on the musical context it appears in, so the caller passes the
// twelve names it wants and this module only does the arithmetic.

/** A specific note in a specific octave, in scientific pitch notation. */
export interface Pitch {
  /** URL segment — `c4`, `eb3`, `ds4`. Derived from `name`. */
  slug: string;
  /** Label shown to the reader — `C4`, `Eb3`, `D#4`. */
  name: string;
  /** Scientific pitch notation octave; middle C is C4. */
  octave: number;
  /**
   * Distance from middle C in semitones, negative below it. This is the number abcjs
   * wants: transposing a tune written on C4 by this much starts it on this pitch.
   */
  semitonesFromC4: number;
}

/**
 * Twelve note names indexed by semitone above C, so `spelling[3]` names the pitch three
 * semitones above C — `Eb` or `D#`, depending on who is asking.
 */
export type Spelling = readonly string[];

/** URL-safe form of a note name: `Eb4` becomes `eb4`, `D#4` becomes `ds4`. */
function toSlug(name: string, octave: number): string {
  return `${name.toLowerCase().replace("#", "s")}${octave}`;
}

/**
 * Every chromatic pitch between two offsets from middle C, inclusive of both ends,
 * named according to `spelling`.
 */
export function pitchesInRange(
  spelling: Spelling,
  fromSemitones: number,
  toSemitones: number,
): Pitch[] {
  if (spelling.length !== 12) {
    throw new Error(`A spelling needs 12 names, got ${spelling.length}`);
  }

  const pitches: Pitch[] = [];
  for (let semitones = fromSemitones; semitones <= toSemitones; semitones++) {
    // Floor division so the octave rolls over correctly below middle C, where
    // `semitones` is negative and `%` alone would give a negative class index.
    const octave = 4 + Math.floor(semitones / 12);
    const name = spelling[semitones - (octave - 4) * 12]!;
    pitches.push({ slug: toSlug(name, octave), name: `${name}${octave}`, octave, semitonesFromC4: semitones });
  }
  return pitches;
}
