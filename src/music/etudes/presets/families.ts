// The preset families, as one list.
//
// Every family is a named set of constants with prose attached, so the index page and
// each family's own page are maps over this rather than five hand-written pages. `kind`
// is the only thing they disagree about: a pattern family can be notated, and the modes
// and instruments are reference tables instead.
//
// Fingerings are deliberately *not* a family. They belong to a note pattern — see
// `notes.ts` — so they are documented on the note patterns' page beside the pattern each
// one fingers.

import { MODES, degreeLetters } from "../scale.ts";
import { ARTICULATIONS } from "./articulations.ts";
import { BOWINGS } from "./bowings.ts";
import { INSTRUMENTS } from "./instruments.ts";
import { NOTE_PATTERNS } from "./notes.ts";
import type { Preset } from "./preset.ts";
import { RHYTHMS } from "./rhythms.ts";

/** The builder field a family fills, for the families that fill one. */
export type PresetField = "notes" | "rhythm" | "bowing" | "articulation";

export interface PresetFamily {
  slug: string;
  name: string;
  /** A line or two on what the family is and how its patterns are written. */
  blurb: string;
  /** The etude field these presets go in, when they go in one. */
  field?: PresetField;
  kind: "pattern" | "reference";
  presets: Preset[];
}

export const PRESET_FAMILIES: PresetFamily[] = [
  {
    slug: "notes",
    name: "Note patterns",
    blurb:
      "The succession of scale degrees that is the etude itself. Degrees 1–7, with ' and , for octaves, # or b in front to alter one, and + to sound notes together as a double stop. Each pattern carries its own named fingerings, because a finger only means something against a particular note.",
    field: "notes",
    kind: "pattern",
    presets: NOTE_PATTERNS,
  },
  {
    slug: "rhythms",
    name: "Rhythms",
    blurb:
      "The durations the notes are said in: s sixteenth, e eighth, q quarter, h half, w whole, with a dot for dotted. A rhythm whose length does not divide the notes' is the point rather than a mistake — the two drift until they realign.",
    field: "rhythm",
    kind: "pattern",
    presets: RHYTHMS,
  },
  {
    slug: "bowings",
    name: "Bowings",
    blurb:
      "How many notes go under one bow. Each number is a slur length and 1 is a separate bow; the direction just alternates, so it is worked out rather than written.",
    field: "bowing",
    kind: "pattern",
    presets: BOWINGS,
  },
  {
    slug: "articulations",
    name: "Articulations",
    blurb:
      "How the bow strokes, as against how many notes it takes at once \u2014 which is the bowing above. One technique code per note, with an optional count: stac3 mart is three staccato then one hammered. Leave it empty and nothing is marked, which is how most of these exercises are printed.",
    field: "articulation",
    kind: "pattern",
    presets: ARTICULATIONS,
  },
  {
    slug: "modes",
    name: "Modes",
    blurb:
      "Which letter degree 1 sits on. A mode here is a rotation of one parent scale rather than a set of intervals, so every unaltered degree is a white key and the printed key signature is always the parent's.",
    kind: "reference",
    presets: MODES.map((mode) => ({
      slug: mode.slug,
      name: mode.name,
      value: degreeLetters(mode).join(" "),
      description: mode.description,
    })),
  },
  {
    slug: "instruments",
    name: "Instruments",
    blurb:
      "The clef the music is drawn in and the octave it is written in. In ABC a clef is presentation only — a letter names an absolute pitch whatever clef is in force — so the same note pattern on three clefs is the same music.",
    kind: "reference",
    presets: INSTRUMENTS.map((instrument) => ({
      slug: instrument.slug,
      name: instrument.name,
      value: `${instrument.clef} clef, root octave ${instrument.rootOctave}, strings ${instrument.strings.join(" ")}`,
      description: instrument.description,
    })),
  },
];

export function familyFor(slug: string): PresetFamily {
  const family = PRESET_FAMILIES.find((candidate) => candidate.slug === slug);
  if (!family) throw new Error(`Unknown preset family "${slug}"`);
  return family;
}

export const PRESETS_PATH = "/music/etudes/presets";

export function familyHref(slug: string): string {
  return `${PRESETS_PATH}/${slug}`;
}
