// The gojūon, as data.
//
// One table, not two: hiragana and katakana are the same syllabary written
// twice, so a row carries the romaji once and the two spellings beside it, and
// the two charts can never disagree about which syllable sits in which cell.
// `GAP` is a cell the syllabary does not have (there is no `yi`, no `wu`), so
// every row is five cells wide and a chart is a plain grid.

/** A cell the syllabary has no character for. */
const GAP = "-";

/** The five vowel columns, in dictionary order. */
export const VOWELS = ["a", "i", "u", "e", "o"] as const;

export type KanaScript = "hiragana" | "katakana";

interface KanaSpec {
  romaji: string[];
  hiragana: string;
  katakana: string;
}

/** The unvoiced syllables: the gojūon proper, plus ん. */
const GOJUON: KanaSpec[] = [
  { romaji: ["a", "i", "u", "e", "o"], hiragana: "あいうえお", katakana: "アイウエオ" },
  { romaji: ["ka", "ki", "ku", "ke", "ko"], hiragana: "かきくけこ", katakana: "カキクケコ" },
  { romaji: ["sa", "shi", "su", "se", "so"], hiragana: "さしすせそ", katakana: "サシスセソ" },
  { romaji: ["ta", "chi", "tsu", "te", "to"], hiragana: "たちつてと", katakana: "タチツテト" },
  { romaji: ["na", "ni", "nu", "ne", "no"], hiragana: "なにぬねの", katakana: "ナニヌネノ" },
  { romaji: ["ha", "hi", "fu", "he", "ho"], hiragana: "はひふへほ", katakana: "ハヒフヘホ" },
  { romaji: ["ma", "mi", "mu", "me", "mo"], hiragana: "まみむめも", katakana: "マミムメモ" },
  { romaji: ["ya", GAP, "yu", GAP, "yo"], hiragana: "や-ゆ-よ", katakana: "ヤ-ユ-ヨ" },
  { romaji: ["ra", "ri", "ru", "re", "ro"], hiragana: "らりるれろ", katakana: "ラリルレロ" },
  { romaji: ["wa", GAP, GAP, GAP, "wo"], hiragana: "わ---を", katakana: "ワ---ヲ" },
  { romaji: ["n", GAP, GAP, GAP, GAP], hiragana: "ん----", katakana: "ン----" },
];

/** The voiced and semi-voiced rows: the same letters with a dakuten. */
const DAKUTEN: KanaSpec[] = [
  { romaji: ["ga", "gi", "gu", "ge", "go"], hiragana: "がぎぐげご", katakana: "ガギグゲゴ" },
  { romaji: ["za", "ji", "zu", "ze", "zo"], hiragana: "ざじずぜぞ", katakana: "ザジズゼゾ" },
  { romaji: ["da", "ji", "zu", "de", "do"], hiragana: "だぢづでど", katakana: "ダヂヅデド" },
  { romaji: ["ba", "bi", "bu", "be", "bo"], hiragana: "ばびぶべぼ", katakana: "バビブベボ" },
  { romaji: ["pa", "pi", "pu", "pe", "po"], hiragana: "ぱぴぷぺぽ", katakana: "パピプペポ" },
];

export interface KanaCell {
  kana: string;
  romaji: string;
}

/** A row of five cells; a cell the syllabary lacks is `null`. */
export type KanaRow = (KanaCell | null)[];

export interface KanaTable {
  /** The unvoiced rows. */
  gojuon: KanaRow[];
  /** The dakuten rows. */
  dakuten: KanaRow[];
}

function toRows(specs: KanaSpec[], script: KanaScript): KanaRow[] {
  return specs.map((spec) => {
    const kana = Array.from(spec[script]);
    // A row that has drifted out of step with its romaji would print a kana
    // under the wrong reading, which is the one mistake a chart must not make.
    if (kana.length !== VOWELS.length || spec.romaji.length !== VOWELS.length) {
      throw new Error(
        `Kana row ${spec.romaji.join(" ")} is not ${VOWELS.length} cells wide`,
      );
    }
    return kana.map((character, i) =>
      character === GAP || spec.romaji[i] === GAP
        ? null
        : { kana: character, romaji: spec.romaji[i]! },
    );
  });
}

/** Both halves of one script's chart, resolved at build time. */
export function kanaTable(script: KanaScript): KanaTable {
  return {
    gojuon: toRows(GOJUON, script),
    dakuten: toRows(DAKUTEN, script),
  };
}
