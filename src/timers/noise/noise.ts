// Noise: steady static in a handful of colours, made to play all night.
//
// The colour of a noise is the slope of its spectrum. White has equal power per
// hertz, so most of what you hear is the top octaves — a hiss. Pink falls 3 dB per
// octave, which is equal power per *octave*, and sounds even across the range.
// Brown falls 6 dB per octave and is mostly rumble. All three are generated here
// from the same random source; only the filter differs.
//
// The page plays through an <audio> element rather than straight out of Web Audio,
// and that choice is the whole reason this module exists in the shape it does. A
// media element is what a phone treats as "something is playing": it keeps going
// with the screen off or another app in front, it gets the lock-screen controls
// through the Media Session API, and an audible page is exempt from the background
// timer throttling the sleep timer relies on. A bare AudioContext gets none of that
// reliably — iOS in particular suspends it when the screen locks. So the noise is
// rendered once into a WAV file in memory and the element loops it.
//
// That makes the loop seam the thing to get right. White noise has no memory, so
// any cut is clean, but pink and brown are filtered and a filter's state at the end
// of a buffer is nowhere near its state at the start — brown noise is a random
// walk, and jumping back to its start is a click every loop. So each buffer is
// rendered a little long and the overhang is crossfaded into the beginning; the last
// sample then runs straight on into the first.

export type NoiseColour = "white" | "pink" | "brown";

export interface Noise {
  colour: NoiseColour;
  label: string;
}

export const NOISES: readonly Noise[] = [
  { colour: "white", label: "White" },
  { colour: "pink", label: "Pink" },
  { colour: "brown", label: "Brown" },
];

export const DEFAULT_COLOUR: NoiseColour = "brown";

/**
 * Sleep timer stops, in minutes; 0 is no timer. Short ones for falling asleep,
 * then whole hours out to twelve, which covers a full night with room over.
 */
export const SLEEP_MINUTES: readonly number[] = [0, 15, 30, 60, 120, 240, 360, 480, 720];

/** A stop's button label: minutes under an hour, whole hours from there. */
export function sleepLabel(minutes: number): string {
  if (minutes === 0) return "Off";
  return minutes < 60 ? `${minutes} min` : `${minutes / 60} hr`;
}

const SAMPLE_RATE = 44_100;

/**
 * Long enough that no pattern in the noise is recognisable as repeating, short
 * enough that the WAV (16-bit mono, ~2.6 MB) is built in a blink and held in
 * memory without a thought.
 */
const LOOP_SECONDS = 30;

/** The overhang crossfaded into the start to hide the seam. */
const CROSSFADE_SECONDS = 1;

/**
 * Every colour is normalised to the same RMS level, -20 dBFS, so switching colour
 * changes the character and not, roughly, the loudness. That leaves white noise's
 * peaks (about 1.7 × RMS) and brown's (a few × RMS) well clear of clipping.
 */
const TARGET_RMS = 0.1;

type Filter = (white: number) => number;

/**
 * Pink: Paul Kellet's "economy" filter — three one-pole lowpasses at staggered
 * corners summed with the input, which tracks -3 dB/octave within about half a
 * decibel across the audible band. The coefficients are for 44.1 kHz.
 */
function pinkFilter(): Filter {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  return (white) => {
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    return b0 + b1 + b2 + white * 0.1848;
  };
}

/**
 * Brown: an integrator, which is exactly -6 dB/octave. A pure integrator wanders
 * off without bound, so this one leaks: the leak puts a corner at about 20 Hz,
 * below which the slope flattens instead of drifting towards DC.
 */
function brownFilter(): Filter {
  const leak = 1 - (2 * Math.PI * 20) / SAMPLE_RATE;
  let last = 0;
  return (white) => {
    last = leak * last + white;
    return last;
  };
}

function filterFor(colour: NoiseColour): Filter {
  if (colour === "pink") return pinkFilter();
  if (colour === "brown") return brownFilter();
  return (white) => white;
}

/** One loop of the colour, seamless end to start, normalised to `TARGET_RMS`. */
export function renderNoise(colour: NoiseColour): Float32Array {
  const length = SAMPLE_RATE * LOOP_SECONDS;
  const fade = SAMPLE_RATE * CROSSFADE_SECONDS;
  const filter = filterFor(colour);

  // Settle the filter first, so the rendered audio starts in its steady state
  // rather than ramping up out of zero.
  for (let i = 0; i < SAMPLE_RATE; i += 1) filter(Math.random() * 2 - 1);

  const raw = new Float32Array(length + fade);
  for (let i = 0; i < raw.length; i += 1) raw[i] = filter(Math.random() * 2 - 1);

  // Fold the overhang into the start. At i = 0 the output is entirely raw[length],
  // which is the sample right after raw[length - 1], the loop's last — so the seam
  // is continuous. The two halves are uncorrelated noise, so an equal-power curve
  // (sin/cos) keeps the level flat through the fade where a linear one would dip.
  const out = raw.slice(0, length);
  for (let i = 0; i < fade; i += 1) {
    const t = (i / fade) * (Math.PI / 2);
    out[i] = raw[i]! * Math.sin(t) + raw[length + i]! * Math.cos(t);
  }

  // Take out the DC the leaky integrator leaves behind, then set the level.
  let sum = 0;
  for (const sample of out) sum += sample;
  const mean = sum / length;
  let squares = 0;
  for (let i = 0; i < length; i += 1) {
    out[i] = out[i]! - mean;
    squares += out[i]! * out[i]!;
  }
  const gain = TARGET_RMS / Math.sqrt(squares / length);
  for (let i = 0; i < length; i += 1) out[i] = out[i]! * gain;

  return out;
}

/** Samples in [-1, 1] as a 16-bit mono PCM WAV file. */
export function encodeWav(samples: Float32Array): Blob {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const view = new DataView(new ArrayBuffer(44 + dataSize));

  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };

  ascii(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * bytesPerSample, true); // byte rate
  view.setUint16(32, bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  ascii(36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]!));
    view.setInt16(44 + i * bytesPerSample, Math.round(clamped * 0x7fff), true);
  }

  return new Blob([view], { type: "audio/wav" });
}

const urls = new Map<NoiseColour, string>();

/**
 * An object URL for the colour's loop, rendered on first ask and kept for the life
 * of the page — switching back to a colour is then instant, and three loops is
 * under 8 MB.
 */
export function noiseUrl(colour: NoiseColour): string {
  let url = urls.get(colour);
  if (!url) {
    url = URL.createObjectURL(encodeWav(renderNoise(colour)));
    urls.set(colour, url);
  }
  return url;
}
