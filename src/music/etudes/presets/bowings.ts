// Bowings: how many notes go under one bow, cycled independently of the notes.
//
// Each number is a slur length; `1` is a separate bow. Bow direction is not written here
// because it only alternates — the generator works it out and marks it.

import type { Preset } from "./preset.ts";

export const BOWINGS: Preset[] = [
  {
    slug: "detache",
    name: "Détaché",
    value: "1",
    description: "A bow per note. The default against which every slur is a departure.",
  },
  {
    slug: "slur-2",
    name: "Slur 2",
    value: "2",
    description:
      "Two notes to a bow. Against an odd-length note pattern the slur starts on a different note each lap.",
  },
  {
    slug: "slur-4",
    name: "Slur 4",
    value: "4",
    description: "Four to a bow — one bow per beat of sixteenths, or per bar of quarters.",
  },
  {
    slug: "three-and-one",
    name: "3 + 1",
    value: "3 1",
    description: "Three slurred then one separate, which lands the bow change off the beat.",
  },
  {
    slug: "one-and-three",
    name: "1 + 3",
    value: "1 3",
    description: "The same pair the other way round, so the separate note comes first.",
  },
  {
    slug: "slur-2-then-singles",
    name: "Slur 2, then two singles",
    value: "2 1 1",
    description:
      "Four notes across three bow strokes — the shortest pattern that makes the bow and the notes disagree.",
  },
];
