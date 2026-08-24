// Single-octave scales played on one string, generated for every starting note.
//
// A scale played on a single string has the same finger pattern wherever it starts:
// the hand shape and the shift are properties of the interval sequence, not of the
// pitch. So the tonic is a *rendering parameter*, not a separate score. Four ABC
// sources — major and minor, each with and without shift notes — are written once on
// C4, and every other tonic is the same source handed to abcjs with a `transposition`.
//
// This module returns data only. `src/content.config.ts` wraps it in a content
// collection; the pages read that collection and never call in here for content.

import { pitchesInRange, type Pitch, type Spelling } from "../pitch.ts";

export type ModeSlug = "major" | "minor";
export type VariationSlug = "no-shift-notes" | "with-shift-notes";

export interface Mode {
  slug: ModeSlug;
  name: string;
}

export interface Variation {
  slug: VariationSlug;
  name: string;
  /** One line of prose explaining what the variation asks of the player. */
  description: string;
}

export const MODES: Mode[] = [
  { slug: "major", name: "Major" },
  { slug: "minor", name: "Minor" },
];

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
const TONIC_SPELLINGS: Record<ModeSlug, Spelling> = {
  major: ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"],
  minor: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "Bb", "B"],
};

/** C3 and C6 as offsets from middle C. Widening this multiplies real, precached pages. */
const LOWEST_TONIC = -12;
const HIGHEST_TONIC = 24;

/** Every starting note that gets pages, named for the mode it will be played in. */
export const TONICS: Record<ModeSlug, Pitch[]> = {
  major: pitchesInRange(TONIC_SPELLINGS.major, LOWEST_TONIC, HIGHEST_TONIC),
  minor: pitchesInRange(TONIC_SPELLINGS.minor, LOWEST_TONIC, HIGHEST_TONIC),
};

export const VARIATIONS: Variation[] = [
  {
    slug: "no-shift-notes",
    name: "No shift notes",
    description:
      "The scale as it sounds, with fingerings marked but the shifts left silent.",
  },
  {
    slug: "with-shift-notes",
    name: "With shift notes",
    description:
      "Each shift is spelled out as an audible slide on the travelling finger, so the hand learns where it is going.",
  },
];

/**
 * The four sources, all written on C4. The fingerings (`!1!`…`!4!`) are the point of
 * the exercise, so these are authored by hand rather than derived — everything else
 * about a variant is a transposition of one of them.
 */
export const BASES: Record<ModeSlug, Record<VariationSlug, string>> = {
  major: {
    "no-shift-notes": `X:1
T:Major Single Octave Scale
M:4/4
L:1/4
K:C major
Q: 52
!1!C !2!D !1!E !2!F | !1!G !2!A !3!B !4!c |
!4!B !3!A !2!G !1!F |  !3!E !2!D !1!C2 |]`,
    "with-shift-notes": `X:1
T:Major Single Octave Scale
M:4/4
L:1/4
K:C major
Q: 52
!1!C (!2!D/ !2!F/)  !1!E (!2!F/ !2!A/) | !1!G !2!A !3!B !4!c |
!4!B !3!A !2!G (!1!F/ !1!C/) |  !3!E !2!D !1!C2 |]`,
  },
  minor: {
    // Melodic minor. `K:C minor` supplies Eb/Ab/Bb, so the raised sixth and seventh are
    // written `=A` and `=B`; the descending forms fall in a later bar and need no mark.
    "no-shift-notes": `X: 1
T:Minor Single Octave Scale
M:4/4
L:1/4
K:C minor
Q: 52
!1!C !2!D  !1!E !2!F | !1!G !2!=A !3!=B !4!c| !4!c !3!B !2!A  !3!G | !2!F  !1!E !2!D :| !1!C4 |]`,
    "with-shift-notes": `X: 1
T:Minor Single Octave Scale
M:4/4
L:1/4
K:C minor
Q: 52
!1!C (!2!D/ !2!F/)  !1!E (!2!F/ !2!A/) | !1!G !2!=A !3!=B !4!c-| !4!c !3!B (!2!A/!2!F/)  !3!G | !2!F  (!1!E/!1!C/) !2!D :| !1!C4 |]`,
  },
};

export const FAMILY = "single-octave-single-string";

/**
 * One generated etude. Deliberately flat and free of nested objects: this is validated
 * by Zod and written into the content store, so it has to survive serialisation.
 */
export interface SingleStringScaleEtude {
  /** Store key, unique per collection. */
  id: string;
  family: typeof FAMILY;
  tonicSlug: string;
  tonicName: string;
  octave: number;
  semitonesFromC4: number;
  modeSlug: ModeSlug;
  modeName: string;
  variationSlug: VariationSlug;
  variationName: string;
  /** Semitones to hand abcjs. The bases sit on C4, so this is the tonic's own offset. */
  transposition: number;
  abcText: string;
  title: string;
}

const BASE_PATH = "/music/etudes/single-octave/single-string";

export function singleStringHref(): string {
  return `${BASE_PATH}/`;
}

export function modeHref(modeSlug: string): string {
  return `${BASE_PATH}/${modeSlug}/`;
}

export function tonicHref(modeSlug: string, tonicSlug: string): string {
  return `${BASE_PATH}/${modeSlug}/${tonicSlug}/`;
}

export function etudeHref(etude: {
  modeSlug: string;
  tonicSlug: string;
  variationSlug: string;
}): string {
  return `${BASE_PATH}/${etude.modeSlug}/${etude.tonicSlug}/${etude.variationSlug}/`;
}

/** The full cross product: both modes, every tonic, both variations. */
export function generateSingleStringScaleEtudes(): SingleStringScaleEtude[] {
  return MODES.flatMap((mode) =>
    TONICS[mode.slug].flatMap((tonic) =>
      VARIATIONS.map((variation) => ({
        id: `${FAMILY}/${mode.slug}/${tonic.slug}/${variation.slug}`,
        family: FAMILY,
        tonicSlug: tonic.slug,
        tonicName: tonic.name,
        octave: tonic.octave,
        semitonesFromC4: tonic.semitonesFromC4,
        modeSlug: mode.slug,
        modeName: mode.name,
        variationSlug: variation.slug,
        variationName: variation.name,
        transposition: tonic.semitonesFromC4,
        abcText: BASES[mode.slug][variation.slug],
        title: `${tonic.name} ${mode.name} — ${variation.name}`,
      })),
    ),
  );
}
