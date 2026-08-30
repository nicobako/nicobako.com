// Vocal sight reading: a fresh line to sing, drawn from one key.
//
// The tune is written on C and handed to abcjs with a transposition, exactly as the
// generated etudes are — a degree is a letter plus an octave, and abcjs supplies the key
// signature and respells everything for the key the reader picked. The keys themselves,
// the octaves, and the cadence that fixes the tonic come from the ear trainer next door,
// which already describes a key as a tonic plus a mode.
//
// The whole point of the exercise is pitch, so the rhythm is not a variable: every note
// is a quarter note and every bar holds four of them. What *is* a variable is how far the
// line may leap, and that is the one thing worth being careful about — see `pickFrom`.
//
// Nothing here touches the DOM. Like the ear trainer, this module is imported by the
// page's client script rather than only its frontmatter, because a new line is drawn in
// the browser every time the reader asks for one.

import { MODES, midiToFreq, type Key } from "../ear-training/ear-training.ts";

/** The letters of the scale as written, before the transposition to the reader's key. */
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;

/** Quarter notes, four to a bar. Neither is a setting — the exercise is about pitch. */
const NOTES_PER_BAR = 4;

/** How fast the playback sings it. A sight-reader sets their own pace; this is only audio. */
export const TEMPO = 72;

/** How long a phrase runs. Four bars is a phrase you can hold in your head at a glance. */
export const BAR_COUNTS = [2, 4, 8] as const;
export const DEFAULT_BARS = 4;

/**
 * Which octaves may be sung, named by the octave the *tonic* sits in, exactly as the ear
 * trainer names them: in C major octave 4 is C4 up to C5. The range reaches a further
 * octave down than the ear trainer's does, because these are lines for a voice and the
 * bottom of a bass's range is below anything you would ask someone to name by ear.
 */
export const OCTAVES = [2, 3, 4, 5] as const;

export const DEFAULT_OCTAVES = [4];

/**
 * The biggest leap a line may take, in scale steps: 1 is stepwise motion, 7 is an octave.
 * Named by the interval the reader sings rather than by the number of steps, since a leap
 * of two steps is a third.
 */
export interface Leap {
  /** Scale steps between one note and the next. */
  steps: number;
  name: string;
}

export const LEAPS: Leap[] = [
  { steps: 1, name: "2nd" },
  { steps: 2, name: "3rd" },
  { steps: 3, name: "4th" },
  { steps: 4, name: "5th" },
  { steps: 5, name: "6th" },
  { steps: 6, name: "7th" },
  { steps: 7, name: "Octave" },
];

/** Steps are the easiest thing to sing, so that is where a reader starts. */
export const DEFAULT_LEAP = 1;

export function leapBySteps(steps: number): Leap {
  return LEAPS.find((leap) => leap.steps === steps) ?? LEAPS[0]!;
}

/**
 * How much less likely each extra step of leap is: a leap of n steps is weighted n^-1.5,
 * so a third is a third as likely as a step and an octave a nineteenth of one. The
 * exponent is what makes a wide limit practisable rather than merely wild — raising the
 * limit widens what *can* happen without much changing what usually does, so most of a
 * line is still stepwise and the leap you allowed turns up as an event rather than a
 * habit. Set it much higher and the setting stops being audible at all.
 */
const LEAP_FALLOFF = 1.5;

function leapWeight(steps: number): number {
  return Math.pow(steps, -LEAP_FALLOFF);
}

/**
 * A leap upward is harder to hear and harder to sing than the same leap down, so it is
 * rarer again. Only leaps carry this: stepwise motion stays even in both directions, so
 * the line does not simply trickle down to the bottom of the range.
 */
const ASCENDING_LEAP_BIAS = 0.7;

/** One note of the scale as written — before the key's transposition is applied. */
interface ScaleNote {
  /**
   * Diatonic position: seven per octave, so two notes a step apart differ by one and the
   * distance between any two notes is the interval the singer has to make. This is what
   * the leap limit is measured in, and it counts the notes the reader did *not* select
   * too, so choosing two octaves with a gap between them does not make the gap a step.
   */
  index: number;
  /** Scale degree, 0–6. Also the letter it is written with, since the tune is written on C. */
  degree: number;
  /** The octave of the key's tonic, as the octave checkboxes name it. */
  octave: number;
}

/**
 * Every note the line may use: each selected octave of the scale, plus the tonic closing
 * the top one, so a single octave reads as C4 up to C5 rather than stopping on the note
 * below it.
 */
function buildScale(octaves: number[]): ScaleNote[] {
  const selected = [...new Set(octaves)].sort((a, b) => a - b);
  const scale: ScaleNote[] = [];
  for (const octave of selected) {
    for (let degree = 0; degree < 7; degree++) {
      scale.push({ index: octave * 7 + degree, degree, octave });
    }
  }
  const top = selected[selected.length - 1]!;
  scale.push({ index: (top + 1) * 7, degree: 0, octave: top + 1 });
  return scale;
}

/**
 * Where the line may go from the note at `from`, as positions in `scale`: everything
 * within the leap limit, or — if the reader picked octaves with a gap between them and
 * nothing is that close — whatever is nearest. A note never repeats, so every note of the
 * line is a fresh interval to sing.
 */
function reachable(scale: ScaleNote[], from: number, maxSteps: number): number[] {
  const distance = (to: number) => Math.abs(scale[to]!.index - scale[from]!.index);
  const others = scale.map((_, to) => to).filter((to) => to !== from);
  const within = others.filter((to) => distance(to) <= maxSteps);
  if (within.length > 0) return within;

  const nearest = Math.min(...others.map(distance));
  return others.filter((to) => distance(to) === nearest);
}

function pickWeighted(choices: number[], weights: number[]): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let threshold = Math.random() * total;
  for (let i = 0; i < choices.length; i++) {
    threshold -= weights[i]!;
    if (threshold <= 0) return choices[i]!;
  }
  return choices[choices.length - 1]!;
}

/** One of `choices`: near notes preferred over far ones, and downward leaps over upward. */
function pickFrom(scale: ScaleNote[], from: number, choices: number[]): number {
  const weights = choices.map((to) => {
    const steps = Math.abs(scale[to]!.index - scale[from]!.index);
    const weight = leapWeight(steps);
    return steps > 1 && scale[to]!.index > scale[from]!.index ? weight * ASCENDING_LEAP_BIAS : weight;
  });
  return pickWeighted(choices, weights);
}

/** The tonic nearest the middle of the range, which is where a phrase starts. */
function homeTonic(scale: ScaleNote[]): number {
  const middle = (scale[0]!.index + scale[scale.length - 1]!.index) / 2;
  const distance = (position: number) => Math.abs(scale[position]!.index - middle);
  return scale
    .map((_, position) => position)
    .filter((position) => scale[position]!.degree === 0)
    .reduce((best, position) => (distance(position) < distance(best) ? position : best));
}

/**
 * Which notes still leave a way home, by how many notes are left after them.
 *
 * Closing on the tonic is not something the last note can decide. With steps only, a line
 * sitting on Fa is three notes away from one, and it cannot sit on Re and step to Do
 * twice over either, because no note repeats — so whether an ending exists depends on
 * where the line is several notes earlier. Rather than guess at a rule for that, the
 * endings are worked out backwards before a note is drawn: with none left a note must be
 * a tonic, and with n left it must be able to reach something that works with n-1. Each
 * note of the line is then drawn only from the notes that still have an ending, which is
 * what makes the close certain rather than lucky.
 */
function endings(scale: ScaleNote[], moves: number[][], count: number): boolean[][] {
  const table: boolean[][] = [scale.map((note) => note.degree === 0)];
  for (let left = 1; left < count; left++) {
    const next = table[left - 1]!;
    table.push(moves.map((options) => options.some((to) => next[to]!)));
  }
  return table;
}

export interface Melody {
  /** ABC source, written on C. Hand it to abcjs with `transposition`. */
  abc: string;
  /** Semitones to shift the notation by to reach the reader's key, 0–11. */
  transposition: number;
  /** What the line sounds like, in order — one frequency per beat. */
  freqs: number[];
}

/**
 * Draw a line.
 *
 * It opens on the tonic the cadence has just put in the reader's ear and closes on one,
 * which is what makes it a phrase rather than a list of notes. Every note is drawn from
 * those that still leave a way home (see `endings`), a rule that binds only over the last
 * few notes — which is exactly where a phrase turns towards its cadence.
 */
export function generateMelody(key: Key, octaves: number[], bars: number, maxSteps: number): Melody {
  const scale = buildScale(octaves);
  const count = Math.max(1, bars) * NOTES_PER_BAR;
  const moves = scale.map((_, from) => reachable(scale, from, maxSteps));
  const hasEnding = endings(scale, moves, count);

  const notes: number[] = [homeTonic(scale)];
  for (let i = 1; i < count; i++) {
    const from = notes[i - 1]!;
    // A range chosen with a gap in it can leave a note with no way home at all, and then
    // the line simply carries on as it was rather than refusing to exist.
    const wanted = moves[from]!.filter((to) => hasEnding[count - 1 - i]![to]!);
    notes.push(pickFrom(scale, from, wanted.length > 0 ? wanted : moves[from]!));
  }

  const line = notes.map((position) => scale[position]!);
  return {
    abc: toAbc(line, scale, key),
    transposition: key.tonicPc,
    freqs: line.map((note) => midiToFreq(soundingMidi(note, key))),
  };
}

/** What a written note actually sounds like once the tune is transposed into the key. */
function soundingMidi(note: ScaleNote, key: Key): number {
  return 12 * (note.octave + 1) + key.tonicPc + MODES[key.mode].offsets[note.degree]!;
}

/** `C` is middle C; higher octaves go lowercase then take apostrophes, lower take commas. */
function pitchLetter(note: ScaleNote): string {
  const letter = LETTERS[note.degree]!;
  if (note.octave >= 5) return letter.toLowerCase() + "'".repeat(note.octave - 5);
  return letter + ",".repeat(4 - note.octave);
}

/**
 * A range centred below this is written on the bass staff — D4, just above the point
 * halfway between the two staves, so a range straddling middle C takes its ledger lines
 * above the bass staff rather than below the treble one, where there are always more.
 */
const BASS_CLEF_BELOW = 62;

/**
 * Which clef the line is easiest to read in, chosen from the pitches rather than left to
 * the reader: it changes nothing about the exercise, only whether it can be read at a
 * glance. A bass's octave written on the treble staff is a wall of ledger lines.
 */
function clef(scale: ScaleNote[], key: Key): string {
  const lowest = soundingMidi(scale[0]!, key);
  const highest = soundingMidi(scale[scale.length - 1]!, key);
  return (lowest + highest) / 2 < BASS_CLEF_BELOW ? " clef=bass" : "";
}

/** The line as ABC: four quarter notes to a bar, four bars to a line of source. */
function toAbc(notes: ScaleNote[], scale: ScaleNote[], key: Key): string {
  const bars: string[] = [];
  for (let i = 0; i < notes.length; i += NOTES_PER_BAR) {
    bars.push(notes.slice(i, i + NOTES_PER_BAR).map(pitchLetter).join(" "));
  }

  const lines: string[] = [];
  for (let i = 0; i < bars.length; i += 4) {
    const last = i + 4 >= bars.length;
    lines.push(bars.slice(i, i + 4).join(" | ") + (last ? " |]" : " |"));
  }

  return [
    "X:1",
    `M:${NOTES_PER_BAR}/4`,
    "L:1/4",
    `Q:1/4=${TEMPO}`,
    `K:C ${key.mode}${clef(scale, key)}`,
    ...lines,
  ].join("\n");
}
