// Ascending on one string: climbing through the positions, a finger pattern at a time.
//
// The exercise, as it is practised: stay on a single string, play the four fingers in a
// chosen order in first position, shift up a step into second position and play the same
// order there, and keep going. What it drills is the shift and the hand shape, so the
// three things worth choosing are which string you are on, how far up you go, and which
// order the fingers come in.
//
// Two facts about the exercise do all the work here.
//
// The first is that the notes are simply consecutive scale degrees above the open string:
// finger `f` in position `p` sounds the `(p - 1) + f`-th degree up. So a note is one
// integer, and the whole etude is written as degrees above a tonic rather than as pitches.
//
// The second follows from it: played in the major scale rooted on the open string, the
// exercise is the *same written shape* on all four strings. So one ABC source is generated
// on C and handed to abcjs with a `transposition`, exactly as the single-octave scales in
// `single-octave-single-string.ts` are — and the four strings come out in G, D, A and E
// major, which is how a violinist plays them anyway.
//
// This module returns data only: tables, a slug or two, and an ABC string. Nothing here
// touches the DOM, and the pages are pure templates over it.

/** One violin string, named by the note it is tuned to. */
export interface ViolinString {
  /** URL segment — `g-string`. */
  slug: string;
  /** Label shown to the reader — `G string`. */
  name: string;
  /** The open string in scientific pitch notation, for the page's own prose. */
  openPitch: string;
  /**
   * Semitones from middle C to the open string. The sources are written with the open
   * string as C4, so this is the number abcjs needs to move the etude onto this string.
   */
  semitonesFromC4: number;
  /** The major key the etude lands in on this string, for the page's own prose. */
  key: string;
}

/** Low to high, as a violinist counts them. */
export const STRINGS: ViolinString[] = [
  { slug: "g-string", name: "G string", openPitch: "G3", semitonesFromC4: -5, key: "G major" },
  { slug: "d-string", name: "D string", openPitch: "D4", semitonesFromC4: 2, key: "D major" },
  { slug: "a-string", name: "A string", openPitch: "A4", semitonesFromC4: 9, key: "A major" },
  { slug: "e-string", name: "E string", openPitch: "E5", semitonesFromC4: 16, key: "E major" },
];

/** A run of positions to climb, inclusive of both ends. */
export interface PositionSpan {
  /** URL segment — `positions-1-7`. */
  slug: string;
  /** Label shown to the reader — `1st–7th`. */
  name: string;
  from: number;
  to: number;
}

/**
 * The two spans that get pages.
 *
 * There are only two because a span that *starts* at first position is already contained
 * in the longer one: each position is written as its own block of systems, so a player who
 * wants first through fifth plays the first five blocks of `1-7` and stops. Only a span
 * that starts somewhere else is a different exercise — it reads in a different register,
 * and it is entered by a shift rather than from the open hand. Adding a third span would
 * cost 96 real, precached pages to print something a reader can already stop early on.
 */
export const SPANS: PositionSpan[] = [
  { slug: "positions-1-7", name: "1st–7th", from: 1, to: 7 },
  { slug: "positions-5-10", name: "5th–10th", from: 5, to: 10 },
];

/** The order the four fingers are played in, within every position. */
export interface FingerPattern {
  /** URL segment and label alike — `1234`. */
  slug: string;
  /** Label shown to the reader — `1–2–3–4`. */
  name: string;
  /** The fingers themselves, in playing order. */
  fingers: number[];
}

/** Every ordering of the four fingers, in lexical order. Generated, not listed. */
function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, index) =>
    permutations([...items.slice(0, index), ...items.slice(index + 1)]).map((rest) => [
      item,
      ...rest,
    ]),
  );
}

export const FINGER_PATTERNS: FingerPattern[] = permutations([1, 2, 3, 4]).map((fingers) => ({
  slug: fingers.join(""),
  name: fingers.join("–"),
  fingers,
}));

/** One generated etude: a string, a span of positions, and a finger order. */
export interface AscendingEtude {
  string: ViolinString;
  span: PositionSpan;
  pattern: FingerPattern;
}

/** The full cross product — every string, span and finger order. */
export const ETUDES: AscendingEtude[] = STRINGS.flatMap((string) =>
  SPANS.flatMap((span) => FINGER_PATTERNS.map((pattern) => ({ string, span, pattern }))),
);

/** The variant that keeps the bare path, so `/music/etudes/ascending-on-string/` resolves. */
export const DEFAULT_ETUDE: AscendingEtude = etudeFor("g-string", "positions-1-7", "1234");

/** The one entry in `ETUDES` with these three slugs. */
export function etudeFor(
  stringSlug: string,
  spanSlug: string,
  patternSlug: string,
): AscendingEtude {
  return ETUDES.find(
    (etude) =>
      etude.string.slug === stringSlug &&
      etude.span.slug === spanSlug &&
      etude.pattern.slug === patternSlug,
  )!;
}

export function isDefaultEtude(etude: AscendingEtude): boolean {
  return (
    etude.string.slug === DEFAULT_ETUDE.string.slug &&
    etude.span.slug === DEFAULT_ETUDE.span.slug &&
    etude.pattern.slug === DEFAULT_ETUDE.pattern.slug
  );
}

export function etudeSlug(etude: AscendingEtude): string {
  return `${etude.string.slug}-${etude.span.slug}-fingers-${etude.pattern.slug}`;
}

const BASE_PATH = "/music/etudes/ascending-on-string";

export function etudeHref(etude: AscendingEtude): string {
  return isDefaultEtude(etude) ? `${BASE_PATH}/` : `${BASE_PATH}/${etudeSlug(etude)}/`;
}

/** Everything except the default, which lives at the bare path instead. */
export function subPageEtudes(): AscendingEtude[] {
  return ETUDES.filter((etude) => !isDefaultEtude(etude));
}

export function etudeName(etude: AscendingEtude): string {
  return `${etude.string.name}, positions ${etude.span.name}, fingers ${etude.pattern.name}`;
}

/** One line of prose saying what this particular variant asks of the player. */
export function describeEtude(etude: AscendingEtude): string {
  const count = etude.span.to - etude.span.from + 1;
  return (
    `Fingers ${etude.pattern.name} on the ${etude.string.name.replace(" string", "")} string, ` +
    `climbing ${count} positions from the ${ordinal(etude.span.from)} to the ` +
    `${ordinal(etude.span.to)}, in ${etude.string.key}.`
  );
}

function ordinal(n: number): string {
  const suffix = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
  return `${n}${suffix}`;
}

// --- The score -------------------------------------------------------------------------

/**
 * The unit note length. At 1/16 every duration the etude uses is a whole number of units,
 * so no note ever needs a fraction.
 */
const UNIT_DENOMINATOR = 16;
const UNITS_PER_BAR = 16;
/** A beat, which is where the beams break. */
const UNITS_PER_BEAT = 4;
/** Half a bar. Every slur is this long, whatever the note value — see `STAGES`. */
const UNITS_PER_SLUR = 8;
/** Each stage of the ladder fills this many bars, which is the least four half notes need. */
const BARS_PER_STAGE = 2;

const TEMPO_BPM = 60;

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;

/**
 * The subdivision ladder: the same finger pattern said four times over, each time twice as
 * fast. Every stage fills the same two bars, so the pattern is stated once, twice, four
 * and eight times — and because a slur is always half a bar, the bow keeps one speed while
 * the notes underneath it accelerate. That is the whole point of the ladder, so the slur
 * length is derived from the duration rather than listed.
 */
const STAGES: { duration: number; label: string }[] = [
  { duration: 8, label: "half notes" },
  { duration: 4, label: "quarter notes" },
  { duration: 2, label: "eighth notes" },
  { duration: 1, label: "sixteenth notes" },
];

/**
 * The ABC token for a scale degree above the open string, which is written as C4.
 *
 * `degree` is `(position - 1) + finger`, so 0 is the open string itself (never played
 * here) and 13 is the fourth finger in tenth position.
 */
function pitchToken(degree: number): string {
  const octave = 4 + Math.floor(degree / 7);
  const letter = LETTERS[degree - (octave - 4) * 7]!;
  if (octave >= 5) return letter.toLowerCase() + "'".repeat(octave - 5);
  return letter + ",".repeat(4 - octave);
}

interface Event {
  degree: number;
  duration: number;
  /** Marked with `!1!` when set; the fast stages are left unmarked to stay readable. */
  finger: number | null;
  slurStart: boolean;
  slurEnd: boolean;
}

function eventToken(event: Event): string {
  let token = "";
  if (event.slurStart) token += "(";
  if (event.finger !== null) token += `!${event.finger}!`;
  token += pitchToken(event.degree);
  if (event.duration !== 1) token += String(event.duration);
  if (event.slurEnd) token += ")";
  return token;
}

/**
 * One line of the tune body: bars separated by `|`, beams broken at each beat.
 *
 * Notes written with no space between them are beamed by abcjs, so a space goes in
 * wherever a beat boundary falls and nowhere else.
 */
function lineFor(events: Event[]): string {
  const bars: string[] = [];
  let bar = "";
  let filled = 0;

  for (const event of events) {
    if (bar !== "" && filled % UNITS_PER_BEAT === 0) bar += " ";
    bar += eventToken(event);
    filled += event.duration;
    if (filled >= UNITS_PER_BAR) {
      bars.push(bar);
      bar = "";
      filled = 0;
    }
  }
  if (bar !== "") bars.push(bar);

  return bars.join(" | ");
}

/** The four notes of one stage, repeated until they fill `BARS_PER_STAGE`. */
function stageEvents(
  position: number,
  fingers: number[],
  duration: number,
  markFingers: boolean,
): Event[] {
  const total = (BARS_PER_STAGE * UNITS_PER_BAR) / duration;
  const perSlur = UNITS_PER_SLUR / duration;
  const events: Event[] = [];

  for (let i = 0; i < total; i++) {
    const finger = fingers[i % fingers.length]!;
    events.push({
      degree: position - 1 + finger,
      duration,
      finger: markFingers ? finger : null,
      // A slur of one note is not a slur, which is what leaves the half notes separate.
      slurStart: perSlur > 1 && i % perSlur === 0,
      slurEnd: perSlur > 1 && i % perSlur === perSlur - 1,
    });
  }

  return events;
}

/**
 * The shift out of `position`: the travelling finger where it is, then the same finger one
 * scale degree higher, which is the next position. Slurred, because the shift is a slide on
 * a finger that stays down, and marked, because which finger travels is the thing to learn.
 */
function shiftEvents(position: number, fingers: number[]): Event[] {
  const finger = fingers[0]!;
  return [
    { degree: position - 1 + finger, duration: 8, finger, slurStart: true, slurEnd: false },
    { degree: position + finger, duration: 8, finger, slurStart: false, slurEnd: true },
  ];
}

/**
 * The etude as ABC, written with the open string as C4 in C major.
 *
 * The caller hands the result to abcjs together with `etude.string.semitonesFromC4`, which
 * moves it onto the real string and lets abcjs spell the key signature and the accidentals.
 */
export function buildAbc(etude: AscendingEtude): string {
  const { span, pattern } = etude;
  const lines: string[] = [];

  for (let position = span.from; position <= span.to; position++) {
    // Fingerings are marked on the slow statement, where they are being taught, and on the
    // shift. The fast stages repeat the same four notes and would only be cluttered by them.
    for (const [index, stage] of STAGES.entries()) {
      lines.push(lineFor(stageEvents(position, pattern.fingers, stage.duration, index === 0)));
    }
    if (position < span.to) {
      lines.push(lineFor(shiftEvents(position, pattern.fingers)));
    }
  }

  // Every line but the last ends open, so abcjs breaks the system there; the last closes
  // the tune.
  const body = lines.map((line, index) =>
    index === lines.length - 1 ? `${line} |]` : `${line} |`,
  );

  return [
    "X:1",
    `T:Ascending on the ${etude.string.name.replace(" string", "")} String`,
    `M:4/4`,
    `L:1/${UNIT_DENOMINATOR}`,
    `Q:1/4=${TEMPO_BPM}`,
    "K:C major",
    ...body,
  ].join("\n");
}
