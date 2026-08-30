// Ear training: the twenty-four keys, the notes a session draws from, and the cadence
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

export type ModeSlug = "major" | "minor";

export interface Mode {
  slug: ModeSlug;
  name: string;
  /** Semitones above the tonic for scale degrees 1–7. */
  offsets: readonly number[];
  /** Movable-do syllable for each of those degrees. */
  syllables: readonly string[];
}

/**
 * Minor is the *natural* form, which is the one a listener hears as "the minor scale".
 * Its raised seventh is not a degree of its own here; it turns up as an accidental (Ti
 * against Te), which is exactly what it is, and the cadence below borrows it for the
 * dominant the way a piece of music does.
 */
export const MODES: Record<ModeSlug, Mode> = {
  major: {
    slug: "major",
    name: "major",
    offsets: [0, 2, 4, 5, 7, 9, 11],
    syllables: ["Do", "Re", "Mi", "Fa", "Sol", "La", "Ti"],
  },
  minor: {
    slug: "minor",
    name: "minor",
    offsets: [0, 2, 3, 5, 7, 8, 10],
    syllables: ["Do", "Re", "Me", "Fa", "Sol", "Le", "Te"],
  },
};

/**
 * Chromatic movable do, for the notes the key does not contain. A note off the scale can
 * be heard as the degree below it raised or the degree above it lowered, and which one it
 * is depends on where the music is going — so both syllables are shown and either reading
 * counts. Where a semitone is only ever one degree (the major third against a minor key)
 * there is only one syllable to give.
 */
const CHROMATIC_SOLFEGE = [
  "Do", "Di/Ra", "Re", "Ri/Me", "Mi", "Fa", "Fi/Se", "Sol", "Si/Le", "La", "Li/Te", "Ti",
] as const;

/** The same for letters: the five black keys answer to two names, the naturals to one. */
const CHROMATIC_LETTERS = [
  "C", "C♯/D♭", "D", "D♯/E♭", "E", "F", "F♯/G♭", "G", "G♯/A♭", "A", "A♯/B♭", "B",
] as const;

/** One of the twelve semitones above a key's tonic, named the way that key names it. */
export interface Tone {
  /** Semitones above the tonic, 0–11. Answers are compared on this. */
  offset: number;
  /** Whether the tone belongs to the key, and so is asked with accidentals switched off. */
  diatonic: boolean;
  /** `Mi`, or `Di/Ra` where the tone answers to two syllables. */
  solfege: string;
  /** `E`, or `C♯/D♭`. A tone of the key is spelled the way the key spells it. */
  letter: string;
}

export interface Key {
  /** URL segment and `<option>` value — `c`, `fs`, `db`, `am`, `csm`. */
  slug: string;
  /** The tonic on its own — `C`, `F♯`, `B♭`. Used where the key is already understood. */
  name: string;
  /** How the key is named in full — `C major`, `B♭ minor`. */
  label: string;
  mode: ModeSlug;
  /** Semitones from C, 0–11. */
  tonicPc: number;
  /** Every semitone of the octave above the tonic, in order. */
  tones: Tone[];
}

/**
 * The tonics, in circle-of-fifths order — the order a musician expects to scan. Each is
 * written as its letter index plus its accidental, and every name in the key is derived,
 * so a key is two numbers rather than a table of seven spellings.
 */
const MAJOR_TONICS: [letter: number, alter: number][] = [
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

const MINOR_TONICS: [letter: number, alter: number][] = [
  [5, 0],  // A
  [2, 0],  // E
  [6, 0],  // B
  [3, 1],  // F♯
  [0, 1],  // C♯
  [4, 1],  // G♯
  [1, 1],  // D♯
  [6, -1], // B♭
  [3, 0],  // F
  [0, 0],  // C
  [4, 0],  // G
  [1, 0],  // D
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

/**
 * The name a key gives its own degree: successive degrees take successive letters, so
 * every letter is used once and the accidental follows from the arithmetic. That is what
 * makes D♭ major spell its fourth G♭ and D♯ minor spell its second E♯.
 */
function spellDegree(tonicLetter: number, tonicPc: number, degree: number, offset: number): string {
  const letterIndex = (tonicLetter + degree) % 7;
  const target = (tonicPc + offset) % 12;
  // Centre the difference on zero so a note a semitone *below* its natural letter reads
  // as one flat rather than eleven sharps.
  const alteration = ((target - NATURAL_PCS[letterIndex]! + 18) % 12) - 6;
  return LETTERS[letterIndex]! + accidentalMark(alteration);
}

function buildKey(letter: number, alter: number, mode: Mode): Key {
  const tonicPc = (NATURAL_PCS[letter]! + alter + 12) % 12;

  const tones: Tone[] = [];
  for (let offset = 0; offset < 12; offset++) {
    const degree = mode.offsets.indexOf(offset);
    tones.push(
      degree >= 0
        ? {
            offset,
            diatonic: true,
            solfege: mode.syllables[degree]!,
            letter: spellDegree(letter, tonicPc, degree, offset),
          }
        : {
            offset,
            diatonic: false,
            solfege: CHROMATIC_SOLFEGE[offset]!,
            letter: CHROMATIC_LETTERS[(tonicPc + offset) % 12]!,
          },
    );
  }

  const name = tones[0]!.letter;
  return {
    slug: toSlug(name) + (mode.slug === "minor" ? "m" : ""),
    name,
    label: `${name} ${mode.name}`,
    mode: mode.slug,
    tonicPc,
    tones,
  };
}

export const KEYS: Key[] = [
  ...MAJOR_TONICS.map(([letter, alter]) => buildKey(letter, alter, MODES.major)),
  ...MINOR_TONICS.map(([letter, alter]) => buildKey(letter, alter, MODES.minor)),
];

export const DEFAULT_KEY = "c";

/** The twelve semitones, as an array to map over — one answer button each. */
export const OFFSETS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

/**
 * Which octaves may be practised, named by the octave the *tonic* sits in: in C major
 * octave 4 is C4 up to C5, in A minor it is A4 up to A5. Three is as many as a sine wave
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
  /** Semitones above the tonic — what the listener is asked to name. */
  offset: number;
  /** Movable-do syllable, or both syllables where the note answers to two. */
  solfege: string;
  /** Letter name with the octave it sounds in — `E4`, or `C♯4/D♭4`. */
  name: string;
  midi: number;
  freq: number;
}

function quizNote(tone: Tone, midi: number): QuizNote {
  // The sounding octave is read back off the MIDI number rather than assumed, because a
  // degree can sit an octave above its tonic: in A major the third of octave 4 is C♯5.
  const octave = Math.floor(midi / 12) - 1;
  return {
    offset: tone.offset,
    solfege: tone.solfege,
    // Both spellings of a two-named note fall in the same octave, since the pairs are the
    // five black keys and none of them straddles a C.
    name: tone.letter
      .split("/")
      .map((spelling) => `${spelling}${octave}`)
      .join("/"),
    midi,
    freq: midiToFreq(midi),
  };
}

/**
 * Every note a question can be drawn from: each octave of the key, plus the tonic closing
 * the top one, so a single octave reads as C4 up to C5 rather than stopping on the note
 * below. With `accidentals` the octave is chromatic — all twelve semitones — rather than
 * the seven the key is built from.
 */
export function notePool(key: Key, octaves: number[], accidentals: boolean): QuizNote[] {
  const selected = [...new Set(octaves)].sort((a, b) => a - b);
  if (selected.length === 0) return [];

  const tones = accidentals ? key.tones : key.tones.filter((tone) => tone.diatonic);
  const notes: QuizNote[] = [];
  for (const octave of selected) {
    for (const tone of tones) notes.push(quizNote(tone, tonicMidi(key, octave) + tone.offset));
  }
  notes.push(quizNote(key.tones[0]!, tonicMidi(key, selected[selected.length - 1]! + 1)));
  return notes;
}

/** The bottom and top of an octave, for the label beside its checkbox — `C4–C5`. */
export function octaveRange(key: Key, octave: number): string {
  return `${key.name}${octave}–${key.name}${octave + 1}`;
}

/**
 * i – iv – V – i, voiced in close position on the tonic: three voices that barely move
 * are enough to fix a key, and keeping the common tone on top is what makes the last
 * chord sound like home. The dominant is major in both modes — the leading tone a
 * semitone under the tonic is most of what tells the ear the cadence has landed — which
 * is why the minor mode borrows it here rather than using its own flat seventh.
 */
const CADENCE: Record<ModeSlug, readonly (readonly number[])[]> = {
  major: [
    [0, 4, 7],  // I
    [0, 5, 9],  // IV, over the tonic
    [-1, 2, 7], // V, over the leading tone
    [0, 4, 7],  // I
  ],
  minor: [
    [0, 3, 7],  // i
    [0, 5, 8],  // iv, over the tonic
    [-1, 2, 7], // V, over the raised leading tone
    [0, 3, 7],  // i
  ],
};

/** The cadence is built on the lowest octave in play, so the questions sit in or above it. */
export function cadenceChords(key: Key, octaves: number[]): number[][] {
  const octave = octaves.length > 0 ? Math.min(...octaves) : DEFAULT_OCTAVES[0]!;
  const root = tonicMidi(key, octave);
  return CADENCE[key.mode].map((chord) => chord.map((offset) => midiToFreq(root + offset)));
}

/** A question, never the same note twice running — a repeat reads as a broken button. */
export function pickNote(pool: QuizNote[], previous: QuizNote | null): QuizNote | null {
  if (pool.length === 0) return null;
  const choices = pool.length > 1 && previous ? pool.filter((n) => n.midi !== previous.midi) : pool;
  return choices[Math.floor(Math.random() * choices.length)]!;
}
