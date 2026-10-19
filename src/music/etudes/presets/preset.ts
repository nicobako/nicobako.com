// A named pattern, with the prose that says what it is for.
//
// The etude model takes patterns as strings, which is what makes any pattern possible.
// A preset is one of those strings that turned out to be worth a name — and the name is
// what a declared etude says instead of re-typing the string.

export interface Preset {
  /** URL and option-value segment. */
  slug: string;
  /** Label shown to the reader. */
  name: string;
  /** The pattern itself, exactly as it would be typed. */
  value: string;
  /** One or two lines on what it asks for and when to reach for it. */
  description: string;
}

/** The preset a pattern came from, if any — so a control can say "Custom" when none did. */
export function findPreset(presets: Preset[], value: string): Preset | undefined {
  const normalised = value.trim().split(/\s+/).join(" ");
  return presets.find((preset) => preset.value === normalised);
}

export function presetFor(presets: Preset[], slug: string): Preset | undefined {
  return presets.find((preset) => preset.slug === slug);
}
