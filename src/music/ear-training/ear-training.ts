// Ear training: the twelve major keys, the notes a session draws from, and the cadence
// that puts the key in the listener's ear before it asks a question.
//
// All of it is a plain table plus arithmetic, and none of it touches the DOM — the page
// maps the returned data to elements. Unlike most modules under `src/music/`, this one is
// imported by the page's client script as well as its frontmatter: the reader changes key
// and octaves while listening, so the note pool and the answer labels have to be rebuilt
// in the browser. What is rebuilt is *data*; the buttons themselves are written as markup
// once and only ever have their text set.

/** Semitones above C for the natural letters, and the letters themselves. */
const NATURAL_PCS = [0, 2, 4, 5, 7, 9, 11] as const;
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;

/** Semitones above the tonic for scale degrees 1–7 of a major scale. */
const MAJOR_OFFSETS = [0, 2, 4, 5, 7, 9, 11] as const;

/** Movable-do syllables, one per scale degree. Major only, so no chromatic syllables. */
export const SOLFEGE = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Ti"] as const;

/** Scale degrees 1–7, as an array to map over. */
export const DEGREES = [1, 2, 3, 4, 5, 6, 7] as const;

export interface Key {
  /** URL segment and `<option>` value — `c`, `fs`, `db`. */
  slug: string;
  /** Label shown to the reader — `C`, `F♯`, `D♭`. */
  name: string;
  /** Semitones from C, 0–11. */
  tonicPc: number;
  /**
   * Letter name of each degree 1–7, spelled for this key: D♭ major is spelled with G♭,
   * F♯ major with E♯, so that every degree gets its own letter exactly once.
   */
  degreeNames: string[];
}

/**
 * The twelve keys, in circle-of-fifths order — the order a musician expects to scan.
 * Each is written as the tonic's letter index plus its accidental, and every name below
 * it is derived, so a key is two numbers rather than a table of seven spellings.
 */
const KEY_SPECS: [letter: number, alter: number][] = [
  [0, 0],  // C
  [4, 0],  // G
  [1, 0],  // D
  [5, 0],  // A
  [2, 0],  // E
  [6, 0],  // B
  [3, 1],  // F♯
  [1, -1], // D♭
  [5, -1], // A♭
  [2, -1], // E♭
  [6, -1], // B♭
  [3, 0],  // F
];

function accidentalMark(alteration: number): string {
  if (alteration > 0) return "♯".repeat(alteration);
  if (alteration < 0) return "♭".repeat(-alteration);
  return "";
}

/** `F♯` becomes `fs`, `D♭` becomes `db` — safe in a URL and in a `data-` attribute. */
function toSlug(name: string): string {
  return name.toLowerCase().replace(/♯/g, "s").replace(/♭/g, "b");
}

function buildKey(letter: number, alter: number): Key {
  const tonicPc = (NATURAL_PCS[letter]! + alter + 12) % 12;

  const degreeNames = MAJOR_OFFSETS.map((offset, i) => {
    const letterIndex = (letter + i) % 7;
    const target = (tonicPc + offset) % 12;
    // Centre the difference on zero so a note a semitone *below* its natural letter
    // reads as one flat rather than eleven sharps.
    const alteration = ((target - NATURAL_PCS[letterIndex]! + 18) % 12) - 6;
    return LETTERS[letterIndex]! + accidentalMark(alteration);
  });

  const name = degreeNames[0]!;
  return { slug: toSlug(name), name, tonicPc, degreeNames };
}

export const KEYS: Key[] = KEY_SPECS.map(([letter, alter]) => buildKey(letter, alter));

export const DEFAULT_KEY = "c";

/**
 * Which octaves may be practised, named by the octave the *tonic* sits in: in C major
 * octave 4 is C4 up to C5, in A major it is A4 up to A5. Three is as many as a sine wave
 * stays pleasant over, and the default is the middle one on its own.
 */
export const OCTAVES = [3, 4, 5] as const;

export const DEFAULT_OCTAVES = [4];

export function keyBySlug(slug: string): Key {
  return KEYS.find((key) => key.slug === slug) ?? KEYS[0]!;
}

/** Middle C is MIDI 60, and A440 is MIDI 69. */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** MIDI number of a key's tonic in a given octave. C4 is 60. */
function tonicMidi(key: Key, octave: number): number {
  return 12 * (octave + 1) + key.tonicPc;
}

export interface QuizNote {
  /** Scale degree, 1–7. This is what the listener is asked to name. */
  degree: number;
  /** Movable-do syllable — `Mi`. */
  solfege: string;
  /** Letter name with the octave it actually sounds in — `E4`. */
  name: string;
  midi: number;
  freq: number;
}

function quizNote(key: Key, degree: number, midi: number): QuizNote {
  // The sounding octave is read back off the MIDI number rather than assumed, because a
  // degree can sit an octave above its tonic: in A major the third of octave 4 is C♯5.
  const octave = Math.floor(midi / 12) - 1;
  return {
    degree,
    solfege: SOLFEGE[degree - 1]!,
    name: `${key.degreeNames[degree - 1]}${octave}`,
    midi,
    freq: midiToFreq(midi),
  };
}

/**
 * Every note a question can be drawn from: the seven degrees of each selected octave,
 * plus the tonic closing the top one, so a single octave reads as C4 up to C5 rather
 * than stopping on the leading tone.
 */
export function notePool(key: Key, octaves: number[]): QuizNote[] {
  const selected = [...new Set(octaves)].sort((a, b) => a - b);
  if (selected.length === 0) return [];

  const notes: QuizNote[] = [];
  for (const octave of selected) {
    for (const degree of DEGREES) {
      notes.push(quizNote(key, degree, tonicMidi(key, octave) + MAJOR_OFFSETS[degree - 1]!));
    }
  }
  notes.push(quizNote(key, 1, tonicMidi(key, selected[selected.length - 1]! + 1)));
  return notes;
}

/** The bottom and top of an octave, for the label beside its checkbox — `C4–C5`. */
export function octaveRange(key: Key, octave: number): string {
  return `${key.name}${octave}–${key.name}${octave + 1}`;
}

/**
 * I – IV – V – I, voiced in close position on the tonic: Do Mi Sol, Do Fa La, Ti Re Sol,
 * Do Mi Sol. Three voices that barely move are enough to fix the key, and keeping the
 * common tone on top is what makes the last chord sound like home. The cadence is built
 * on the lowest octave in play so the questions sit inside it or above it.
 */
const CADENCE: readonly (readonly number[])[] = [
  [0, 4, 7],  // I
  [0, 5, 9],  // IV, over the tonic
  [-1, 2, 7], // V, over the leading tone
  [0, 4, 7],  // I
];

export function cadenceChords(key: Key, octaves: number[]): number[][] {
  const octave = octaves.length > 0 ? Math.min(...octaves) : DEFAULT_OCTAVES[0]!;
  const root = tonicMidi(key, octave);
  return CADENCE.map((chord) => chord.map((offset) => midiToFreq(root + offset)));
}

/** A question, never the same note twice running — a repeat reads as a broken button. */
export function pickNote(pool: QuizNote[], previous: QuizNote | null): QuizNote | null {
  if (pool.length === 0) return null;
  const choices = pool.length > 1 && previous ? pool.filter((n) => n.midi !== previous.midi) : pool;
  return choices[Math.floor(Math.random() * choices.length)]!;
}
