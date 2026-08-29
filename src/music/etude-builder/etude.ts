// The custom etude builder: three patterns plus a key, turned into one ABC tune.
//
// The premise is that an etude is a short pattern said four ways at once — which notes,
// which fingers, which rhythm, which bowing — and that the useful ones come from letting
// those patterns run at *different lengths*. Notes of length 5 against a rhythm of 3 and a
// bowing of 2 do not repeat for 30 notes. So the three lists cycle independently and the
// generated tune runs until they realign (see `cycleLength`).
//
// Fingerings are not one of the cycling axes: a finger only means something against a
// particular note, and some finger/note pairs are unplayable, so a fingering is written
// inline with the note it belongs to and travels with it.
//
// This module returns data only — an ABC string and a list of parse errors. Nothing here
// touches the DOM; `etude-builder.astro` hands the result to `AbcEditor`, which is the
// same renderer the ABC editor page uses.

export type ModeSlug = "major" | "minor";

export interface Mode {
  slug: ModeSlug;
  name: string;
}

export const MODES: Mode[] = [
  { slug: "major", name: "Major" },
  { slug: "minor", name: "Minor" },
];

/**
 * Semitones above the tonic for scale degrees 1–7.
 *
 * Minor is the *natural* form. The raised sixth and seventh of the harmonic and melodic
 * forms are deliberately not modes of their own: melodic minor is direction-dependent,
 * and "is this note ascending?" has no answer in a pattern that zigzags (broken thirds,
 * `1 3 2 4 3 5`, are the common case here). Writing `#7` or `#6 #7` in the notes says it
 * explicitly, at exactly the notes the player means.
 */
const DEGREE_OFFSETS: Record<ModeSlug, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

/** Semitones above C for the natural letters, and the letters themselves. */
const NATURAL_OFFSETS = [0, 2, 4, 5, 7, 9, 11] as const;
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;

/**
 * What the printed key signature already does to each letter, so the generator only
 * writes an accidental where the note differs from it. Tunes are always written on C —
 * `K:C major` has no accidentals, `K:C minor` supplies Eb, Ab and Bb — and every other
 * key is reached by handing abcjs a transposition, exactly as the generated etudes in
 * `single-octave-single-string.ts` do.
 */
const KEY_SIGNATURE: Record<ModeSlug, readonly number[]> = {
  major: [0, 0, 0, 0, 0, 0, 0],
  minor: [0, 0, -1, 0, 0, -1, -1],
};

/**
 * The unit note length. At 1/32 every duration the rhythm box can spell — including the
 * dotted ones — is a whole number of units, so no note ever needs a fraction.
 */
const UNIT_DENOMINATOR = 32;

const RHYTHM_UNITS: Record<string, number> = { s: 2, e: 4, q: 8, h: 16, w: 32 };

/** Names for the rhythm letters, for the page's own help text. */
export const RHYTHM_NAMES: [string, string][] = [
  ["s", "sixteenth"],
  ["e", "eighth"],
  ["q", "quarter"],
  ["h", "half"],
  ["w", "whole"],
];

/** Runaway patterns are capped rather than allowed to generate thousands of bars. */
const MAX_NOTES = 192;

const NOTE_PATTERN = /^([#b]*)([1-7])([',]*)(?:\(([0-4])\))?$/;
const RHYTHM_PATTERN = /^([seqhw])(\.?)$/;
const BOWING_PATTERN = /^[1-9][0-9]*$/;
const METER_PATTERN = /^(\d+)\/(\d+)$/;

export interface ParsedNote {
  /** Scale degree, 1–7. */
  degree: number;
  /** Octaves above (or below) the tonic's own octave. */
  octave: number;
  /** Semitones the typed accidentals move the degree by. */
  accidental: number;
  /** Left-hand finger, 0 for an open string, or null to leave the note unmarked. */
  finger: number | null;
}

export interface EtudeSpec {
  title: string;
  notes: string;
  rhythm: string;
  bowing: string;
  mode: ModeSlug;
  meter: string;
  tempo: number;
  /** How many notes to generate, or null to run until the three patterns realign. */
  length: number | null;
  showBowings: boolean;
  startUpBow: boolean;
}

export interface BuildResult {
  /** The ABC source, or "" when the spec could not be parsed. */
  abc: string;
  /** How many notes were generated. */
  noteCount: number;
  /** How many notes one full cycle of all three patterns takes. */
  cycle: number;
  /** Human-readable parse problems; `abc` is empty whenever this is non-empty. */
  errors: string[];
}

function tokenize(input: string): string[] {
  return input.trim().split(/\s+/).filter(Boolean);
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

export function parseNotes(input: string): { notes: ParsedNote[]; errors: string[] } {
  const notes: ParsedNote[] = [];
  const errors: string[] = [];

  for (const token of tokenize(input)) {
    const match = NOTE_PATTERN.exec(token);
    if (!match) {
      errors.push(`Note "${token}" isn't a degree 1–7, optionally with #/b, ' or , and a finger in parentheses.`);
      continue;
    }
    const [, accidentals = "", degree = "1", octaves = "", finger] = match;
    notes.push({
      degree: Number(degree),
      octave:
        (octaves.match(/'/g)?.length ?? 0) - (octaves.match(/,/g)?.length ?? 0),
      accidental:
        (accidentals.match(/#/g)?.length ?? 0) - (accidentals.match(/b/g)?.length ?? 0),
      finger: finger === undefined ? null : Number(finger),
    });
  }

  if (notes.length === 0 && errors.length === 0) errors.push("Add some notes.");
  return { notes, errors };
}

export function parseRhythm(input: string): { durations: number[]; errors: string[] } {
  const durations: number[] = [];
  const errors: string[] = [];

  for (const token of tokenize(input)) {
    const match = RHYTHM_PATTERN.exec(token);
    if (!match) {
      errors.push(`Rhythm "${token}" isn't one of s, e, q, h, w with an optional dot.`);
      continue;
    }
    const [, letter = "q", dot = ""] = match;
    const base = RHYTHM_UNITS[letter]!;
    durations.push(dot ? base * 1.5 : base);
  }

  if (durations.length === 0 && errors.length === 0) errors.push("Add a rhythm.");
  return { durations, errors };
}

export function parseBowing(input: string): { groups: number[]; errors: string[] } {
  const groups: number[] = [];
  const errors: string[] = [];

  for (const token of tokenize(input)) {
    if (!BOWING_PATTERN.test(token)) {
      errors.push(`Bowing "${token}" isn't a slur length — use whole numbers, 1 for a separate bow.`);
      continue;
    }
    groups.push(Number(token));
  }

  if (groups.length === 0 && errors.length === 0) errors.push("Add a bowing.");
  return { groups, errors };
}

/** How many notes it takes for all three patterns to line up again from the start. */
export function cycleLength(notes: number, rhythm: number, bowing: number): number {
  return lcm(lcm(notes, rhythm), bowing);
}

/** The ABC accidental that moves a letter by `alteration` semitones. */
function accidentalMark(alteration: number): string {
  if (alteration <= -2) return "__";
  if (alteration === -1) return "_";
  if (alteration === 0) return "=";
  if (alteration === 1) return "^";
  return "^^";
}

/** `C` is middle C; higher octaves go lowercase then take apostrophes, lower take commas. */
function pitchLetter(letterIndex: number, octave: number): string {
  const letter = LETTERS[letterIndex]!;
  if (octave >= 5) return letter.toLowerCase() + "'".repeat(octave - 5);
  return letter + ",".repeat(4 - octave);
}

/**
 * Build the tune.
 *
 * The three patterns are indexed independently — notes and rhythm by note number, bowing
 * by slur group — so a short list simply repeats under a longer one. Barlines are placed
 * by accumulated duration rather than by counting notes, which is what lets a rhythm that
 * does not divide the bar drift across it the way these exercises are meant to.
 */
export function buildEtude(spec: EtudeSpec): BuildResult {
  const { notes, errors: noteErrors } = parseNotes(spec.notes);
  const { durations, errors: rhythmErrors } = parseRhythm(spec.rhythm);
  const { groups, errors: bowingErrors } = parseBowing(spec.bowing);

  const meterMatch = METER_PATTERN.exec(spec.meter.trim());
  const meterErrors = meterMatch ? [] : [`Meter "${spec.meter}" isn't a fraction like 4/4.`];

  const errors = [...noteErrors, ...rhythmErrors, ...bowingErrors, ...meterErrors];
  if (errors.length > 0 || !meterMatch) {
    return { abc: "", noteCount: 0, cycle: 0, errors };
  }

  const [, beats = "4", beatUnit = "4"] = meterMatch;
  const barUnits = (Number(beats) * UNIT_DENOMINATOR) / Number(beatUnit);
  if (!Number.isInteger(barUnits) || barUnits <= 0) {
    return { abc: "", noteCount: 0, cycle: 0, errors: [`Meter "${spec.meter}" doesn't divide evenly.`] };
  }

  // Notes written with no space between them are beamed by abcjs, so the generator joins
  // everything inside one beat and breaks the beam at each beat boundary. Compound meters
  // beam in threes, which is what makes 6/8 group by the dotted quarter rather than the
  // eighth.
  const unitsPerBeat = UNIT_DENOMINATOR / Number(beatUnit);
  const beamGroup =
    Number(beatUnit) === 8 && Number(beats) % 3 === 0 ? unitsPerBeat * 3 : unitsPerBeat;

  const bowedNotes = groups.reduce((sum, group) => sum + group, 0);
  const cycle = cycleLength(notes.length, durations.length, bowedNotes);
  const count = Math.min(spec.length ?? cycle, MAX_NOTES);

  const body: string[] = [];
  let barText = "";
  let lastGroup = -1;
  let filled = 0;
  // Accidentals carry to the end of the bar in ABC, so the generator tracks what is
  // currently in force per letter-and-octave and only writes a mark when it changes.
  let inForce = new Map<string, number>();

  let groupIndex = 0;
  let remainingInGroup = groups[0]!;
  let bowIsDown = !spec.startUpBow;

  for (let i = 0; i < count; i++) {
    const note = notes[i % notes.length]!;
    const duration = durations[i % durations.length]!;
    const startsGroup = remainingInGroup === groups[groupIndex]!;
    const groupSize = groups[groupIndex]!;

    const letterIndex = note.degree - 1;
    const octave = 4 + note.octave;
    const alteration =
      DEGREE_OFFSETS[spec.mode][letterIndex]! - NATURAL_OFFSETS[letterIndex]! + note.accidental;

    const voiceKey = `${letterIndex}:${octave}`;
    const current = inForce.get(voiceKey) ?? KEY_SIGNATURE[spec.mode][letterIndex]!;

    let token = "";
    if (startsGroup && groupSize > 1) token += "(";
    if (startsGroup && spec.showBowings) token += bowIsDown ? "!downbow!" : "!upbow!";
    if (note.finger !== null) token += `!${note.finger}!`;
    if (alteration !== current) {
      token += accidentalMark(alteration);
      inForce.set(voiceKey, alteration);
    }
    token += pitchLetter(letterIndex, octave);
    if (duration !== 1) token += String(duration);

    remainingInGroup -= 1;
    if (remainingInGroup === 0) {
      if (groupSize > 1) token += ")";
      groupIndex = (groupIndex + 1) % groups.length;
      remainingInGroup = groups[groupIndex]!;
      bowIsDown = !bowIsDown;
    }

    const beam = Math.floor(filled / beamGroup);
    if (barText !== "" && beam !== lastGroup) barText += " ";
    barText += token;
    lastGroup = beam;
    filled += duration;

    // A note that overruns the bar is left whole and the barline goes after it, so the
    // following bars stay aligned to the meter rather than to the overrun.
    if (filled >= barUnits) {
      body.push(barText);
      barText = "";
      lastGroup = -1;
      filled -= barUnits;
      inForce = new Map();
    }
  }

  if (barText !== "") body.push(barText);

  // Four bars to a line keeps the source readable and gives abcjs a sensible wrap.
  const lines: string[] = [];
  for (let i = 0; i < body.length; i += 4) {
    const isLast = i + 4 >= body.length;
    lines.push(body.slice(i, i + 4).join(" | ") + (isLast ? " |]" : " |"));
  }

  const title = spec.title.trim().replace(/[\r\n]+/g, " ") || "Etude";
  const abc = [
    "X:1",
    `T:${title}`,
    `M:${Number(beats)}/${Number(beatUnit)}`,
    `L:1/${UNIT_DENOMINATOR}`,
    `Q:1/4=${spec.tempo}`,
    `K:C ${spec.mode}`,
    ...lines,
  ].join("\n");

  return { abc, noteCount: count, cycle, errors: [] };
}
