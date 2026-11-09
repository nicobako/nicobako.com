// Note patterns: the succession of scale degrees that is the etude itself.
//
// Degrees 1–7, with `u` and `d` after for an octave up or down, `s` or `b` in front to
// sharpen or flatten one, `.` and a finger last, and `,` to sound notes together as a
// double stop. Everything is a digit, a letter, `.` or `,`, so a pattern can be typed on
// a phone without hunting through the symbol pages.
//
// **A fingering is part of a pattern, not a list of its own.** A finger only means
// something against a particular note, so "0 1 2 3 0 1 2 3" is not a preset in the way a
// rhythm is — it is one of the handful of ways to play *this* scale. Each such way is a
// note pattern in its own right, with the fingers written on the notes.

import type { Preset } from "./preset.ts";

export type NotePattern = Preset;

export const NOTE_PATTERNS: NotePattern[] = [
  {
    slug: "scale",
    name: "Scale, one octave",
    value: "1 2 3 4 5 6 7 1u",
    description:
      "One octave up. Eight notes against a rhythm or bowing of any other length is the simplest way to hear what the cycling does.",
  },
  {
    slug: "scale-open-string-first-position",
    name: "Scale, open string, first position",
    value: "1.0 2.1 3.2 4.3 5.0 6.1 7.2 1u.3",
    description:
      "The one-octave scale on two strings, four notes each, hand still. The plainest way to play it and the one to learn the notes on.",
  },
  {
    slug: "scale-single-string",
    name: "Scale, single string",
    value: "1.0 2.1 3.2 4.4 5.1 6.2 7.3 1u.4",
    description:
      "All eight notes on one string, which means a shift partway up. The scale sounds alike all the way through because the string never changes.",
  },
  {
    slug: "scale-shifting",
    name: "Scale, shifting",
    value: "1.1 2.2 3.1 4.2 5.1 6.2 7.3 1u.4",
    description:
      "Up through the positions on one string, shifting every two notes. Drills the shift rather than the notes.",
  },
  {
    slug: "scale-two-octaves",
    name: "Scale, two octaves",
    value: "1 2 3 4 5 6 7 1u 2u 3u 4u 5u 6u 7u 1uu",
    description:
      "Fifteen notes up. Two octaves is where the left hand has to shift rather than reach, so the pattern is as much about getting there as about the notes.",
  },
  {
    slug: "scale-three-octaves",
    name: "Scale, three octaves",
    value: "1 2 3 4 5 6 7 1u 2u 3u 4u 5u 6u 7u 1uu 2uu 3uu 4uu 5uu 6uu 7uu 1uuu",
    description:
      "Twenty-two notes up, which on a violin written from root octave 4 reaches C7. It sits near the top of the instrument, so the range check will say so if the mode or the key pushes it over \u2014 a real three-octave scale is played from the lowest string, which here means picking the root octave and key that put it there.",
  },
  {
    slug: "up-and-down",
    name: "Up and down, one octave",
    value: "1 2 3 4 5 6 7 1u 7 6 5 4 3 2",
    description:
      "Up and back without repeating the top or the bottom note, so the pattern is fourteen notes and loops seamlessly.",
  },
  {
    slug: "up-and-down-two-octaves",
    name: "Up and down, two octaves",
    value: "1 2 3 4 5 6 7 1u 2u 3u 4u 5u 6u 7u 1uu 7u 6u 5u 4u 3u 2u 1u 7 6 5 4 3 2",
    description:
      "Twenty-eight notes, up and back without repeating either end, so it loops seamlessly against a rhythm of any other length.",
  },
  {
    slug: "up-and-down-three-octaves",
    name: "Up and down, three octaves",
    value: "1 2 3 4 5 6 7 1u 2u 3u 4u 5u 6u 7u 1uu 2uu 3uu 4uu 5uu 6uu 7uu 1uuu 7uu 6uu 5uu 4uu 3uu 2uu 1uu 7u 6u 5u 4u 3u 2u 1u 7 6 5 4 3 2",
    description:
      "Forty-two notes, the full climb and descent. The longest plain pattern here, and the one where a bowing of three or five drifts furthest before it comes home.",
  },
  {
    slug: "galamian-three-octaves",
    name: "Galamian three-octave scale",
    value: "1 3 2 1 2 3 4 5 6 7 1u 2u 3u 4u 5u 6u 7u 1uu 2uu 3uu 4uu 5uu 6uu 7uu 1uuu 7uu 6uu 5uu 4uu 3uu 2uu 1uu 7u 6u 5u 4u 3u 2u 1u 7 6 5 4 3 2 1 3 2",
    description:
      "The three-octave scale with Galamian's turn at each end \u2014 1 3 2 before the climb and again after the descent. The turn is not ornament: it makes the scale forty-eight notes, which divides by 2, 3, 4, 6, 8, 12, 16 and 24, so every grouping of his acceleration comes out even. It also ends off the tonic, which is exactly what a pattern meant to be cycled wants.",
  },
  {
    slug: "broken-thirds",
    name: "Broken thirds",
    value: "1 3 2 4 3 5 4 6 5 7 6 1u",
    description:
      "Up a third, back a second, over and over. The standard scale variant, and the one that makes a direction-dependent melodic minor meaningless — write the accidentals you mean instead.",
  },
  {
    slug: "arpeggio",
    name: "Arpeggio",
    value: "1 3 5 1u 5 3",
    description: "The tonic triad up and down. Six notes, so it cycles quickly against anything.",
  },
  {
    slug: "turns",
    name: "Turns",
    value: "1 2 1 7d 1 3 2 1",
    description:
      "A turn around the tonic, dipping below it. Good for the left hand's smallest movements rather than for covering ground.",
  },
  {
    slug: "pedal-tonic",
    name: "Pedal tonic",
    value: "1 2 1 3 1 4 1 5",
    description:
      "The tonic between every step of the scale. Intonation practice: the ear keeps being handed the reference note.",
  },
  {
    slug: "thirds",
    name: "Thirds",
    value: "1,3 2,4 3,5 4,6 5,7 6,1u",
    description: "Double-stopped thirds up the scale. One bow and one rhythm value per pair.",
  },
  {
    slug: "sixths",
    name: "Sixths",
    value: "1,6 2,7 3,1u 4,2u",
    description: "Double-stopped sixths, which sit under a wider hand than the thirds do.",
  },
  {
    slug: "octaves",
    name: "Octaves",
    value: "1,1u 2,2u 3,3u 4,4u",
    description: "Double-stopped octaves — the frame of the hand, with nothing to hide behind.",
  },
];
