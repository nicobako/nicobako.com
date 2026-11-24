// The note values a rhythm is spelled with.
//
// `s` sixteenth, `e` eighth, `q` quarter, `h` half, `w` whole, with a dot for dotted and
// a leading `3` for a triplet. A rhythm whose length does not divide the note pattern's
// is the point of the tool, not a mistake: the two drift against each other until they
// realign.
//
// The letters and their words, which is what the rhythm lane's keys are labelled with.
// `etude.ts` owns what each one is *worth*; this is only how to say it out loud.
export const RHYTHM_NAMES: [string, string][] = [
  ["s", "sixteenth"],
  ["e", "eighth"],
  ["q", "quarter"],
  ["h", "half"],
  ["w", "whole"],
];
