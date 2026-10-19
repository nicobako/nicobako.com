// Note patterns: the succession of scale degrees that is the etude itself, and the
// fingerings that go with each one.
//
// Degrees 1–7, with `'` and `,` for octaves, `#`/`b` in front to alter one, and `+` to
// sound notes together as a double stop.
//
// **A fingering belongs to a pattern, not to a list of its own.** A finger only means
// something against a particular note, so "0 1 2 3 0 1 2 3" is not a preset in the way a
// rhythm is — it is one of the handful of ways to play *this* scale, and naming it
// ("open string, first position") is what makes it worth keeping. So each pattern below
// carries its own named fingerings, and the builder offers the ones belonging to the
// pattern in the box.

import type { Preset } from "./preset.ts";

/** One way to finger a particular note pattern. */
export interface Fingering {
  slug: string;
  name: string;
  /** One finger per note of the pattern, `-` for unmarked, `+` within a double stop. */
  value: string;
  description: string;
}

export interface NotePattern extends Preset {
  fingerings: Fingering[];
}

export const NOTE_PATTERNS: NotePattern[] = [
  {
    slug: "scale",
    name: "Scale",
    value: "1 2 3 4 5 6 7 1'",
    description:
      "One octave up. Eight notes against a rhythm or bowing of any other length is the simplest way to hear what the cycling does.",
    fingerings: [
      {
        slug: "open-string-first-position",
        name: "Open string, first position",
        value: "0 1 2 3 0 1 2 3",
        description:
          "Two strings, four notes each, hand still. The plainest way to play it and the one to learn the notes on.",
      },
      {
        slug: "single-string",
        name: "Single string",
        value: "0 1 2 4 1 2 3 4",
        description:
          "All eight notes on one string, which means a shift partway up. The scale sounds alike all the way through because the string never changes.",
      },
      {
        slug: "shifting",
        name: "Shifting",
        value: "1 2 1 2 1 2 3 4",
        description:
          "Up through the positions on one string, shifting every two notes. Drills the shift rather than the notes.",
      },
    ],
  },
  {
    slug: "up-and-down",
    name: "Up and down",
    value: "1 2 3 4 5 6 7 1' 7 6 5 4 3 2",
    description:
      "Up and back without repeating the top or the bottom note, so the pattern is fourteen notes and loops seamlessly.",
    fingerings: [],
  },
  {
    slug: "broken-thirds",
    name: "Broken thirds",
    value: "1 3 2 4 3 5 4 6 5 7 6 1'",
    description:
      "Up a third, back a second, over and over. The standard scale variant, and the one that makes a direction-dependent melodic minor meaningless — write the accidentals you mean instead.",
    fingerings: [],
  },
  {
    slug: "arpeggio",
    name: "Arpeggio",
    value: "1 3 5 1' 5 3",
    description: "The tonic triad up and down. Six notes, so it cycles quickly against anything.",
    fingerings: [],
  },
  {
    slug: "turns",
    name: "Turns",
    value: "1 2 1 7, 1 3 2 1",
    description:
      "A turn around the tonic, dipping below it. Good for the left hand's smallest movements rather than for covering ground.",
    fingerings: [],
  },
  {
    slug: "pedal-tonic",
    name: "Pedal tonic",
    value: "1 2 1 3 1 4 1 5",
    description:
      "The tonic between every step of the scale. Intonation practice: the ear keeps being handed the reference note.",
    fingerings: [],
  },
  {
    slug: "thirds",
    name: "Thirds",
    value: "1+3 2+4 3+5 4+6 5+7 6+1'",
    description: "Double-stopped thirds up the scale. One bow and one rhythm value per pair.",
    fingerings: [],
  },
  {
    slug: "sixths",
    name: "Sixths",
    value: "1+6 2+7 3+1' 4+2'",
    description: "Double-stopped sixths, which sit under a wider hand than the thirds do.",
    fingerings: [],
  },
  {
    slug: "octaves",
    name: "Octaves",
    value: "1+1' 2+2' 3+3' 4+4'",
    description: "Double-stopped octaves — the frame of the hand, with nothing to hide behind.",
    fingerings: [],
  },
];

export function notePatternFor(value: string): NotePattern | undefined {
  const normalised = value.trim().split(/\s+/).join(" ");
  return NOTE_PATTERNS.find((pattern) => pattern.value === normalised);
}
