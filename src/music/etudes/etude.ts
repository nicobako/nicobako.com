// What an etude is, and how one becomes a tune.
//
// An etude here is a short pattern said several ways at once: which notes, which
// rhythm, which bowing, which fingers, in which mode, in which key, on which
// instrument. The premise of the thing is that the useful exercises come from letting
// the *time* patterns run at different lengths — notes of length 5 against a rhythm of
// 3 and a bowing of 2 do not repeat for 30 notes — so those three lists cycle
// independently and the generated tune runs until they realign (see `cycleLength`).
//
// Three of the fields are not cycling axes, for reasons worth stating:
//
// - A **fingering** is an annotation. A finger means something only against a particular
//   note under a particular hand position, so one that drifted would mark the wrong
//   finger every lap — and worse, it would change how long the etude is. Its length must
//   divide the note pattern's, and inline `(n)` in the notes overrides it.
// - The **mode** rotates which letter degree 1 sits on, so every unaltered degree is a
//   white key and the tune is always written `K:C`. See `scale.ts`.
// - The **key** is a transposition handed to abcjs, and the **root octave** is the
//   register the music is written in. They are deliberately separate: the key picks a
//   pitch class only, so changing it never moves the octave and changing the octave
//   never moves the key.
//
// This module returns data only — an ABC string and a list of problems. Nothing here
// touches the DOM; the builder page hands the result to `AbcEditor` and `Etude.astro`
// hands it to `AbcTrack`.

import { NATURAL_OFFSETS, abcPitch, accidentalMark } from "../abc-pitch.ts";
import {
  degreeIndex,
  keyFor,
  modeFor,
  normaliseOffset,
  type Mode,
  type ModeSlug,
} from "./scale.ts";
import {
  instrumentMatching,
  type ClefSlug,
} from "./presets/instruments.ts";
import { BOWINGS } from "./presets/bowings.ts";
import { NOTE_PATTERNS, notePatternFor } from "./presets/notes.ts";
import { findPreset, type Preset } from "./presets/preset.ts";
import { RHYTHMS } from "./presets/rhythms.ts";

/**
 * The unit note length. At 1/32 every duration the rhythm box can spell — including the
 * dotted ones — is a whole number of units, so no note ever needs a fraction.
 */
const UNIT_DENOMINATOR = 32;

const RHYTHM_UNITS: Record<string, number> = { s: 2, e: 4, q: 8, h: 16, w: 32 };

/** Runaway patterns are capped rather than allowed to generate thousands of bars. */
const MAX_NOTES = 192;

const NOTE_PATTERN = /^([#b]*)([1-7])([',]*)$/;
const RHYTHM_PATTERN = /^([seqhw])(\.?)$/;
const BOWING_PATTERN = /^[1-9][0-9]*$/;
const FINGER_PATTERN = /^(?:[0-4]|-)$/;
const METER_PATTERN = /^(\d+)\/(\d+)$/;

export interface NoteMember {
  /** Scale degree, 1–7. */
  degree: number;
  /** Octaves above (or below) the root octave. */
  octave: number;
  /** Semitones the typed accidentals move the degree by. */
  accidental: number;
}

/**
 * One thing the bow does: a single note, or a double stop of several notes sounded
 * together. An event takes one duration from the rhythm and one place in the bowing
 * however many pitches it holds, which is what a double stop is — one stroke.
 */
export interface NoteEvent {
  members: NoteMember[];
}

export interface Etude {
  title: string;
  /** URL segment, derived from the title unless given. */
  slug: string;
  notes: string;
  rhythm: string;
  bowing: string;
  /** Fingers by note, `-` for unmarked; empty for none. */
  fingering: string;
  mode: ModeSlug;
  /** Semitones handed to abcjs as `visualTranspose`, `[-6, 5]`. */
  keyOffset: number;
  clef: ClefSlug;
  /** The octave degree 1 is written in; middle C is octave 4. */
  rootOctave: number;
  meter: string;
  tempo: number;
  /** How many notes to generate, or null to run until the three patterns realign. */
  length: number | null;
  showBowings: boolean;
  startUpBow: boolean;
}

export interface BuildResult {
  /** The ABC source, or "" when the etude could not be parsed. */
  abc: string;
  /** How many notes were generated. */
  noteCount: number;
  /** How many notes one full cycle of notes, rhythm and bowing takes. */
  cycle: number;
  /** Semitones to hand abcjs; the source itself is always written on C. */
  transposition: number;
  /** Human-readable problems; `abc` is empty whenever this is non-empty. */
  errors: string[];
}

const DEFAULTS: Omit<Etude, "title" | "slug"> = {
  notes: "1 2 3 4 5 6 7 1'",
  rhythm: "q",
  bowing: "1",
  fingering: "",
  mode: "ionian",
  keyOffset: 0,
  clef: "treble",
  rootOctave: 4,
  meter: "4/4",
  tempo: 72,
  length: null,
  showBowings: true,
  startUpBow: false,
};

export function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * An etude from as little as a title: everything else has a default, so declaring one is
 * a line. The slug is derived from the title unless it is given.
 */
export function defineEtude(spec: Partial<Etude> & { title: string }): Etude {
  return {
    ...DEFAULTS,
    slug: slugify(spec.title),
    ...spec,
    keyOffset: normaliseOffset(spec.keyOffset ?? DEFAULTS.keyOffset),
  };
}

/** A sentence naming what this etude asks for, by preset name wherever one matches. */
export function describeEtude(etude: Etude): string {
  const mode = modeFor(etude.mode);
  const name = (list: Preset[], value: string) =>
    findPreset(list, value)?.name.toLowerCase() ?? value.trim();

  const instrument = instrumentMatching(etude.clef, etude.rootOctave);
  const parts = [
    `${name(NOTE_PATTERNS, etude.notes)} in ${keyFor(mode, etude.keyOffset).label}`,
    `${name(RHYTHMS, etude.rhythm)} rhythm`,
    `${name(BOWINGS, etude.bowing)} bowing`,
  ];
  if (etude.fingering.trim() !== "") {
    const fingerings = notePatternFor(etude.notes)?.fingerings ?? [];
    const match = fingerings.find(
      (fingering) => fingering.value === etude.fingering.trim().split(/\s+/).join(" "),
    );
    parts.push(`${match ? match.name.toLowerCase() : etude.fingering.trim()} fingering`);
  }
  parts.push(instrument ? instrument.name.toLowerCase() : `${etude.clef} clef`);
  return parts.join(", ") + ".";
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

function parseMember(part: string): NoteMember | null {
  const match = NOTE_PATTERN.exec(part);
  if (!match) return null;
  const [, accidentals = "", degree = "1", octaves = ""] = match;
  return {
    degree: Number(degree),
    octave: (octaves.match(/'/g)?.length ?? 0) - (octaves.match(/,/g)?.length ?? 0),
    accidental:
      (accidentals.match(/#/g)?.length ?? 0) - (accidentals.match(/b/g)?.length ?? 0),
  };
}

/**
 * Whitespace separates events; `+` joins the notes of a double stop into one. Every
 * member is a note in its own right, so each carries its own accidental and octave —
 * `b3+5` is a minor third. Which finger plays it is the fingering's business.
 */
export function parseNotes(input: string): { notes: NoteEvent[]; errors: string[] } {
  const notes: NoteEvent[] = [];
  const errors: string[] = [];

  for (const token of tokenize(input)) {
    const members: NoteMember[] = [];
    for (const part of token.split("+")) {
      const member = parseMember(part);
      if (!member) {
        errors.push(
          `Note "${token}" isn't a degree 1–7 — optionally with #/b in front, ' or , for octaves, and + between the notes of a double stop. Fingers go in the fingering, not here.`,
        );
        members.length = 0;
        break;
      }
      members.push(member);
    }
    if (members.length > 0) notes.push({ members });
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

/**
 * Fingers by note: one token per note, each `0`–`4` or `-` for unmarked, and `+`-joined
 * for a double stop.
 *
 * The length is checked against the notes rather than cycled freely, because a finger
 * that lands on a different note each lap is a different — often impossible — exercise.
 * A pattern that divides the notes keeps every finger on the note it was written for.
 */
export function parseFingering(
  input: string,
  noteCount: number,
): { fingers: (number | null)[][]; errors: string[] } {
  const fingers: (number | null)[][] = [];
  const errors: string[] = [];

  for (const token of tokenize(input)) {
    const members = token.split("+").map((part) => (part === "-" ? null : Number(part)));
    if (!token.split("+").every((part) => FINGER_PATTERN.test(part))) {
      errors.push(`Fingering "${token}" isn't a finger 0–4, or - for unmarked.`);
      continue;
    }
    fingers.push(members);
  }

  if (fingers.length > 0 && noteCount % fingers.length !== 0) {
    errors.push(
      `A fingering of ${fingers.length} doesn't divide ${noteCount} notes — use a length that does, so each finger stays on its own note.`,
    );
  }

  return { fingers, errors };
}

/** How many notes it takes for notes, rhythm and bowing to line up again from the start. */
export function cycleLength(notes: number, rhythm: number, bowing: number): number {
  return lcm(lcm(notes, rhythm), bowing);
}

/**
 * One note of an event: its fingering, the accidental it needs against what is already
 * in force in this bar, and its pitch. Duration is not included — a double stop carries
 * a single duration outside the brackets that hold its members.
 *
 * The mode rotates which letter the degree lands on and every unaltered degree is a
 * white key, so an accidental is written only where the note asked for one — but the
 * in-force map still earns its place, cancelling a `#7` with `=` later in the same bar.
 */
function renderMember(
  member: NoteMember,
  mode: Mode,
  rootOctave: number,
  finger: number | null,
  inForce: Map<string, number>,
): string {
  const index = degreeIndex(mode, member.degree, member.octave) + 7 * (rootOctave - 4);
  const alteration = member.accidental;

  const current = inForce.get(String(index)) ?? 0;

  let out = "";
  if (finger !== null) out += `!${finger}!`;
  if (alteration !== current) {
    out += accidentalMark(alteration);
    inForce.set(String(index), alteration);
  }
  return out + abcPitch(index);
}

/** Semitones from middle C of a written member, before the key offset. */
function memberSemitones(member: NoteMember, mode: Mode, rootOctave: number): number {
  const index = degreeIndex(mode, member.degree, member.octave) + 7 * (rootOctave - 4);
  const octave = Math.floor(index / 7);
  return NATURAL_OFFSETS[index - octave * 7]! + 12 * octave + member.accidental;
}

/**
 * Whether the music fits on the instrument the clef and root octave name.
 *
 * Only checked when the pair matches a known instrument, so an unusual combination is
 * allowed rather than second-guessed. It catches the one mistake this model makes easy:
 * a cello study left at the violin's root octave.
 */
function rangeErrors(etude: Etude, notes: NoteEvent[], mode: Mode): string[] {
  const instrument = instrumentMatching(etude.clef, etude.rootOctave);
  if (!instrument) return [];

  const sounding = notes.flatMap((event) =>
    event.members.map(
      (member) => memberSemitones(member, mode, etude.rootOctave) + etude.keyOffset,
    ),
  );
  const low = Math.min(...sounding);
  const high = Math.max(...sounding);

  const errors: string[] = [];
  if (low < instrument.lowest) {
    errors.push(
      `${Math.round(instrument.lowest - low)} semitones below the ${instrument.name.toLowerCase()}'s lowest note (${instrument.strings[0]}) — raise the root octave or the key.`,
    );
  }
  if (high > instrument.highest) {
    errors.push(
      `${Math.round(high - instrument.highest)} semitones above where the ${instrument.name.toLowerCase()} can play — lower the root octave or the key.`,
    );
  }
  return errors;
}

/**
 * Build the tune.
 *
 * Notes, rhythm and bowing are indexed independently — notes and rhythm by note number,
 * bowing by slur group — so a short list simply repeats under a longer one. Barlines are
 * placed by accumulated duration rather than by counting notes, which is what lets a
 * rhythm that does not divide the bar drift across it the way these exercises are meant
 * to.
 */
export function buildEtude(etude: Etude): BuildResult {
  const mode = modeFor(etude.mode);
  const { notes, errors: noteErrors } = parseNotes(etude.notes);
  const { durations, errors: rhythmErrors } = parseRhythm(etude.rhythm);
  const { groups, errors: bowingErrors } = parseBowing(etude.bowing);
  const { fingers, errors: fingeringErrors } = parseFingering(etude.fingering, notes.length);

  const meterMatch = METER_PATTERN.exec(etude.meter.trim());
  const meterErrors = meterMatch ? [] : [`Meter "${etude.meter}" isn't a fraction like 4/4.`];

  // A finger belongs to a note, so a token holding the wrong number of fingers for the
  // note it lands on is a real mistake rather than something to pad out.
  const fingerShapeErrors: string[] = [];
  if (fingers.length > 0 && notes.length % fingers.length === 0) {
    for (const [i, event] of notes.entries()) {
      const token = fingers[i % fingers.length]!;
      if (token.length !== event.members.length) {
        fingerShapeErrors.push(
          `Note ${i + 1} sounds ${event.members.length} notes but its fingering gives ${token.length} — join a double stop's fingers with +, as in 1+3.`,
        );
        break;
      }
    }
  }

  const errors = [
    ...noteErrors,
    ...rhythmErrors,
    ...bowingErrors,
    ...fingeringErrors,
    ...fingerShapeErrors,
    ...meterErrors,
    ...(noteErrors.length === 0 ? rangeErrors(etude, notes, mode) : []),
  ];
  if (errors.length > 0 || !meterMatch) {
    return { abc: "", noteCount: 0, cycle: 0, transposition: etude.keyOffset, errors };
  }

  const [, beats = "4", beatUnit = "4"] = meterMatch;
  const barUnits = (Number(beats) * UNIT_DENOMINATOR) / Number(beatUnit);
  if (!Number.isInteger(barUnits) || barUnits <= 0) {
    return {
      abc: "",
      noteCount: 0,
      cycle: 0,
      transposition: etude.keyOffset,
      errors: [`Meter "${etude.meter}" doesn't divide evenly.`],
    };
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
  const count = Math.min(etude.length ?? cycle, MAX_NOTES);

  const body: string[] = [];
  let barText = "";
  let lastGroup = -1;
  let filled = 0;
  // Accidentals carry to the end of the bar in ABC, so the generator tracks what is
  // currently in force per written note and only writes a mark when it changes.
  let inForce = new Map<string, number>();

  let groupIndex = 0;
  let remainingInGroup = groups[0]!;
  let bowIsDown = !etude.startUpBow;

  for (let i = 0; i < count; i++) {
    const event = notes[i % notes.length]!;
    const duration = durations[i % durations.length]!;
    const fingered = fingers.length > 0 ? fingers[i % fingers.length]! : [];
    const startsGroup = remainingInGroup === groups[groupIndex]!;
    const groupSize = groups[groupIndex]!;

    let token = "";
    if (startsGroup && groupSize > 1) token += "(";
    if (startsGroup && etude.showBowings) token += bowIsDown ? "!downbow!" : "!upbow!";

    // A double stop is one event: its members go inside brackets and the duration sits
    // outside them, so the bow and the rhythm still see a single note.
    const members = event.members.map((member, m) =>
      renderMember(member, mode, etude.rootOctave, fingered[m] ?? null, inForce),
    );
    token += members.length > 1 ? `[${members.join("")}]` : members[0]!;
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

  const title = etude.title.trim().replace(/[\r\n]+/g, " ") || "Etude";
  const abc = [
    "X:1",
    `T:${title}`,
    `M:${Number(beats)}/${Number(beatUnit)}`,
    `L:1/${UNIT_DENOMINATOR}`,
    `Q:1/4=${etude.tempo}`,
    // Always C, because the mode is a rotation of the white keys rather than a set of
    // accidentals, and the real key is the transposition. The clef is display only.
    `K:C clef=${etude.clef}`,
    ...lines,
  ].join("\n");

  return { abc, noteCount: count, cycle, transposition: etude.keyOffset, errors: [] };
}
