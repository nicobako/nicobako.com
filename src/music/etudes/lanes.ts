// The four cycling axes as things you can *tap*, rather than things you have to spell.
//
// `etude.ts` reads four little languages: `s7`, `1.1,3.3`, `3e`, `q14`, `2 1 1`,
// `stac3 mart`. They are good languages — compact, phone-typable, and the only way to
// say every pattern the model allows — but they are a manual you have to read before you
// can make a scale. This module is the other direction: each lane's vocabulary as data,
// one token as a *record* rather than a string, and the writer that spells that record
// the way `etude.ts` reads it.
//
// So the grammar has exactly one definition (the exported token regexes in `etude.ts`)
// and two directions. A chip can never spell something its own lane cannot parse, and
// the text box behind each lane stays the same text box it always was — which is what
// keeps bookmarked links, the query string and the whole model untouched by any of this.
//
// Data only. Nothing here touches the DOM: the builder page maps a chip to an element
// and a keypress to `applyKey`.

import {
  ARTICULATION_TOKEN,
  BOWING_TOKEN,
  MAX_NOTES,
  RHYTHM_TOKEN,
  parseMember,
  type NoteMember,
} from "./etude.ts";
import { TECHNIQUES } from "./tables/articulations.ts";
import { RHYTHM_NAMES } from "./tables/rhythms.ts";

export type LaneId = "notes" | "rhythm" | "bowing" | "articulation";

/**
 * One token of one lane, tagged by the lane it belongs to.
 *
 * A tagged union rather than four parallel types: the builder holds a selection that can
 * be in any lane, and one `Token` keeps that selection a single variable instead of four.
 */
export type Token =
  | { lane: "notes"; members: NoteMember[] }
  | {
      lane: "rhythm";
      letter: string;
      dotted: boolean;
      triplet: boolean;
      count: number;
    }
  | { lane: "bowing"; slur: number }
  | { lane: "articulation"; code: string; count: number };

/**
 * One chip. `token` is null when the text in the box is not a token at all — a typo, or
 * an old link — and the chip shows the raw text and says so rather than vanishing.
 */
export interface Chip {
  raw: string;
  token: Token | null;
}

/** A key on a lane's keypad: what it does, and the value it does it with. */
export interface Keypress {
  act: string;
  value: string;
}

const MAX_OCTAVE = 3;
const MAX_SLUR = 12;

// ---------------------------------------------------------------------------
// Vocabularies — the keypads are markup, so these resolve at build time.
// ---------------------------------------------------------------------------

export const DEGREES = [1, 2, 3, 4, 5, 6, 7] as const;

/** Written in front of the degree, so this is the order they read in. */
export const ACCIDENTALS: { value: number; label: string }[] = [
  { value: -2, label: "♭♭" },
  { value: -1, label: "♭" },
  { value: 0, label: "♮" },
  { value: 1, label: "♯" },
  { value: 2, label: "♯♯" },
];

/** An unmarked note is the normal case, so "none" is a key rather than the absence of one. */
export const FINGERS: { value: string; label: string }[] = [
  { value: "", label: "—" },
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
];

/** `s` sixteenth … `w` whole, with the words, which is what the keys are labelled with. */
export const RHYTHM_VALUES: { value: string; label: string; name: string }[] =
  RHYTHM_NAMES.map(([letter, name]) => ({
    value: letter,
    label: letter,
    name,
  }));

export const SLURS = Array.from({ length: MAX_SLUR }, (_, i) => i + 1);

/**
 * A lane: its name, and nothing else.
 *
 * There was a list of named patterns here — "Broken thirds", "Galamian three-octave
 * scale" — that filled a lane in one tap. It is gone on purpose: it was someone else's
 * answer to which patterns are worth having, carried in the code for everyone. The
 * patterns worth keeping are the ones you built, and those go on the shelf under the
 * names you gave them. See `shelf.ts`.
 */
export interface LaneSpec {
  id: LaneId;
  name: string;
}

export const LANES: LaneSpec[] = [
  { id: "notes", name: "Notes" },
  { id: "rhythm", name: "Rhythm" },
  { id: "bowing", name: "Bowing" },
  { id: "articulation", name: "Articulation" },
];

// ---------------------------------------------------------------------------
// Reading and writing one token
// ---------------------------------------------------------------------------

function parseToken(lane: LaneId, raw: string): Token | null {
  if (lane === "notes") {
    const members: NoteMember[] = [];
    for (const part of raw.split(",")) {
      const member = parseMember(part);
      if (!member) return null;
      members.push(member);
    }
    return members.length > 0 ? { lane, members } : null;
  }

  if (lane === "rhythm") {
    const match = RHYTHM_TOKEN.exec(raw);
    if (!match) return null;
    const [, triplet, letter = "q", dot = "", digits = ""] = match;
    return {
      lane,
      letter,
      dotted: dot !== "",
      triplet: triplet !== undefined,
      count: digits === "" ? 1 : Number(digits),
    };
  }

  if (lane === "bowing") {
    if (!BOWING_TOKEN.test(raw)) return null;
    return { lane, slur: Number(raw) };
  }

  const match = ARTICULATION_TOKEN.exec(raw);
  if (!match) return null;
  const code = match[1]!;
  if (!TECHNIQUES.some((technique) => technique.code === code)) return null;
  return { lane, code, count: match[2] === "" ? 1 : Number(match[2]!) };
}

/**
 * A lane's text as chips, one per whitespace-separated token, invalid ones included.
 *
 * Lower-cased for the same reason the model lower-cases: a phone capitalises the first
 * letter of a field.
 */
export function parseLane(lane: LaneId, text: string): Chip[] {
  return text
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => ({ raw, token: parseToken(lane, raw) }));
}

function formatMember(member: NoteMember): string {
  const accidental =
    member.accidental >= 0
      ? "s".repeat(member.accidental)
      : "b".repeat(-member.accidental);
  const octave =
    member.octave >= 0 ? "u".repeat(member.octave) : "d".repeat(-member.octave);
  const finger = member.finger === null ? "" : `.${member.finger}`;
  return accidental + member.degree + octave + finger;
}

/** The token, spelled the way its lane's box spells it. */
export function formatToken(token: Token): string {
  switch (token.lane) {
    case "notes":
      return token.members.map(formatMember).join(",");
    case "rhythm":
      return (
        (token.triplet ? "3" : "") +
        token.letter +
        (token.dotted ? "." : "") +
        (token.count > 1 ? token.count : "")
      );
    case "bowing":
      return String(token.slur);
    case "articulation":
      return token.code + (token.count > 1 ? token.count : "");
  }
}

/** A lane's chips back into the one line of text the model reads. */
export function formatLane(chips: Chip[]): string {
  return chips
    .map((chip) => (chip.token === null ? chip.raw : formatToken(chip.token)))
    .join(" ");
}

/**
 * What a chip reads as, as one line per note.
 *
 * A double stop gets a line per member so the chip stacks the way the staff does; every
 * other lane is a single line. The lines are the token's own spelling rather than a
 * second notation to learn — which is what makes the text box behind the lane readable
 * once you have tapped a few.
 */
export function chipLines(token: Token): string[] {
  switch (token.lane) {
    case "notes":
      return token.members.map(formatMember).reverse();
    case "rhythm": {
      const value =
        (token.triplet ? "3" : "") + token.letter + (token.dotted ? "." : "");
      return [token.count > 1 ? `${value}×${token.count}` : value];
    }
    case "bowing":
      return [token.slur === 1 ? "1" : `⌒${token.slur}`];
    case "articulation":
      return [token.count > 1 ? `${token.code}×${token.count}` : token.code];
  }
}

/** The token a `+` adds to an empty lane: the plainest thing that lane can say. */
export function defaultToken(lane: LaneId): Token {
  switch (lane) {
    case "notes":
      return {
        lane,
        members: [{ degree: 1, octave: 0, accidental: 0, finger: null }],
      };
    case "rhythm":
      return { lane, letter: "q", dotted: false, triplet: false, count: 1 };
    case "bowing":
      return { lane, slur: 1 };
    case "articulation":
      return { lane, code: "det", count: 1 };
  }
}

/** How many notes a note chip sounds at once; 1 for every other lane. */
export function memberCount(token: Token): number {
  return token.lane === "notes" ? token.members.length : 1;
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

/**
 * One keypress against one token, as a new token.
 *
 * `member` is which note of a double stop the press lands on, and is ignored by every
 * lane but the notes — a press on a rhythm has nothing to choose between.
 *
 * Unknown acts return the token unchanged rather than throwing: a keypad is markup, and
 * markup and this switch can disagree for one deploy without breaking the page.
 */
export function applyKey(token: Token, press: Keypress, member = 0): Token {
  const { act, value } = press;

  if (token.lane === "notes") {
    const members = token.members.map((note) => ({ ...note }));
    const note = members[clamp(member, 0, members.length - 1)]!;
    switch (act) {
      case "degree":
        note.degree = Number(value);
        break;
      case "acc":
        note.accidental = Number(value);
        break;
      case "oct":
        note.octave = clamp(note.octave + Number(value), -MAX_OCTAVE, MAX_OCTAVE);
        break;
      case "finger":
        note.finger = value === "" ? null : Number(value);
        break;
      // A double stop is built from the note already there: a third above it is the
      // interval that wants one most often, and every other interval is one tap away.
      // Above, not merely two letters on — past the seventh the third is in the next
      // octave, and a chord that folded back down would be a sixth the wrong way.
      case "add-note": {
        const third = note.degree + 2;
        members.push({
          ...note,
          degree: third > 7 ? third - 7 : third,
          octave: note.octave + (third > 7 ? 1 : 0),
        });
        break;
      }
      case "drop-note":
        if (members.length > 1) members.splice(member, 1);
        break;
    }
    return { ...token, members };
  }

  if (token.lane === "rhythm") {
    switch (act) {
      case "value":
        return { ...token, letter: value };
      case "dot":
        return { ...token, dotted: !token.dotted };
      case "triplet":
        return { ...token, triplet: !token.triplet };
      case "count":
        return { ...token, count: clamp(token.count + Number(value), 1, MAX_NOTES) };
    }
    return token;
  }

  if (token.lane === "bowing") {
    if (act === "slur") return { ...token, slur: clamp(Number(value), 1, MAX_SLUR) };
    return token;
  }

  switch (act) {
    case "code":
      return { ...token, code: value };
    case "count":
      return { ...token, count: clamp(token.count + Number(value), 1, MAX_NOTES) };
  }
  return token;
}

/**
 * Which keypad keys are lit for this token, as act → value.
 *
 * The page compares each key's own act and value against this, so the keypad's pressed
 * state is read from the token rather than tracked beside it — there is nothing to fall
 * out of sync. A toggle reports `"on"` or `""`, since a toggle's value is itself.
 */
export function keyState(token: Token, member = 0): Record<string, string> {
  switch (token.lane) {
    case "notes": {
      const note = token.members[clamp(member, 0, token.members.length - 1)]!;
      return {
        degree: String(note.degree),
        acc: String(note.accidental),
        finger: note.finger === null ? "" : String(note.finger),
      };
    }
    case "rhythm":
      return {
        value: token.letter,
        dot: token.dotted ? "on" : "",
        triplet: token.triplet ? "on" : "",
      };
    case "bowing":
      return { slur: String(token.slur) };
    case "articulation":
      return { code: token.code };
  }
}

/**
 * What a lane's chips contribute to the cycle: how many *notes* long the lane is.
 *
 * Not the number of chips — `q14` is one chip and fourteen notes, `3e` is one chip and
 * three. This is the number the lane shows next to its name, and the number the realign
 * point is worked out from, so it is the one that has to agree with `etude.ts`.
 *
 * The chips say which lane they are from, so this does not have to be told.
 */
export function laneLength(chips: Chip[]): number {
  let total = 0;
  for (const { token } of chips) {
    if (!token) continue;
    switch (token.lane) {
      case "notes":
        total += 1;
        break;
      case "rhythm":
        total += token.count * (token.triplet ? 3 : 1);
        break;
      case "bowing":
        total += token.slur;
        break;
      case "articulation":
        total += token.count;
        break;
    }
  }
  return total;
}
