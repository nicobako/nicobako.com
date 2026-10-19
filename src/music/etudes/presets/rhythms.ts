// Rhythms: the durations the notes are said in, cycled independently of them.
//
// `s` sixteenth, `e` eighth, `q` quarter, `h` half, `w` whole, with a dot for dotted.
// A rhythm whose length does not divide the note pattern's is the point of the tool, not
// a mistake: the two drift against each other until they realign.

import type { Preset } from "./preset.ts";

/** The letters, for the page's own help text. */
export const RHYTHM_NAMES: [string, string][] = [
  ["s", "sixteenth"],
  ["e", "eighth"],
  ["q", "quarter"],
  ["h", "half"],
  ["w", "whole"],
];

export const RHYTHMS: Preset[] = [
  {
    slug: "quarters",
    name: "Quarters",
    value: "q",
    description: "Even quarter notes. One value, so the notes keep their own phrasing.",
  },
  {
    slug: "eighths",
    name: "Eighths",
    value: "e",
    description: "Even eighths, two to a beat in 4/4.",
  },
  {
    slug: "sixteenths",
    name: "Sixteenths",
    value: "s",
    description: "Even sixteenths. Four to a beat, and the fastest even value here.",
  },
  {
    slug: "long-short-short",
    name: "Long–short–short",
    value: "q e e",
    description:
      "Three values against a note pattern of almost any length, so the long note lands somewhere new each time round.",
  },
  {
    slug: "gallop",
    name: "Gallop",
    value: "e. s",
    description: "Dotted eighth and sixteenth. Fills a beat, so it stays aligned to the bar.",
  },
  {
    slug: "reverse-gallop",
    name: "Reverse gallop",
    value: "s e.",
    description: "The gallop turned round, which puts the short note on the beat.",
  },
];
