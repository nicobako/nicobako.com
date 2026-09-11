// The hiragana Word Steps plays in: the grid a player taps, and the romanisation that
// turns a Japanese puzzle into a URL.
//
// A ladder needs an alphabet — a fixed set of characters, any one of which may replace
// any other. Hiragana gives one readily, with two wrinkles worth stating. A dakuten mark
// makes a *different* character (`か` and `が` are two keys, not one key and a modifier),
// which is what makes `はし → はじ` a legal single step. And the small kana `ゃゅょっ`
// are characters in their own right here, so `きょう → きゅう` is one step, exactly as it
// looks. Neither needs special handling anywhere else: a rung only counts if it is a word
// in the list, so no rule has to forbid the strings that are not.

/**
 * The gojūon, in the shape it is written and taught: five vowels across, one consonant
 * row down. An empty string is a hole in the grid (`や` has no `i` column), kept so the
 * rows still line up under each other on screen.
 */
export const KANA_GRID: readonly (readonly string[])[] = [
  ["あ", "い", "う", "え", "お"],
  ["か", "き", "く", "け", "こ"],
  ["さ", "し", "す", "せ", "そ"],
  ["た", "ち", "つ", "て", "と"],
  ["な", "に", "ぬ", "ね", "の"],
  ["は", "ひ", "ふ", "へ", "ほ"],
  ["ま", "み", "む", "め", "も"],
  ["や", "", "ゆ", "", "よ"],
  ["ら", "り", "る", "れ", "ろ"],
  ["わ", "", "", "", "を"],
  ["ん", "", "", "", ""],
];

/** The voiced and half-voiced rows, and the small kana, in the same five-wide shape. */
export const KANA_GRID_MARKED: readonly (readonly string[])[] = [
  ["が", "ぎ", "ぐ", "げ", "ご"],
  ["ざ", "じ", "ず", "ぜ", "ぞ"],
  ["だ", "ぢ", "づ", "で", "ど"],
  ["ば", "び", "ぶ", "べ", "ぼ"],
  ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"],
  ["ゃ", "ゅ", "ょ", "っ", ""],
];

/** Every character a hiragana word may be spelled with. */
export const KANA: readonly string[] = [...KANA_GRID, ...KANA_GRID_MARKED]
  .flat()
  .filter((kana) => kana !== "");

const ROMAJI: Record<string, string> = {
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", を: "o", ん: "n",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
};

const SMALL_YA: Record<string, string> = { ゃ: "ya", ゅ: "yu", ょ: "yo" };

/**
 * A hiragana word written in Latin letters, for use in a URL. Close enough to Hepburn to
 * read aloud, and it only has to be stable and unambiguous — `きょう` becomes `kyou`, not
 * `kyō`, because a slug has no room for a macron.
 */
export function romanise(word: string): string {
  const characters = [...word];
  let out = "";

  for (let i = 0; i < characters.length; i++) {
    const kana = characters[i]!;

    // A small tsu doubles the consonant that follows it: `きって` → `kitte`.
    if (kana === "っ") {
      const next = characters[i + 1];
      const nextRomaji = next ? (SMALL_YA[next] ?? ROMAJI[next] ?? "") : "";
      out += nextRomaji.charAt(0);
      continue;
    }

    const small = SMALL_YA[kana];
    if (small) {
      // `き` + `ゃ` is one sound, so the `i` of `ki` is dropped before `ya` is added.
      // Where that leaves a syllable English already spells with a vowel — `sh`, `ch`,
      // `j` — only the vowel is added, giving `sha` rather than `shya`.
      const stem = out.replace(/i$/, "");
      out = stem + (/(sh|ch|j)$/.test(stem) ? small.slice(1) : small);
      continue;
    }

    out += ROMAJI[kana] ?? "";
  }

  return out;
}
