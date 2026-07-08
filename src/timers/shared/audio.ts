// Shared Web Audio helpers for timer completion sounds. A single AudioContext
// is created lazily (on first user-triggered call) and reused, mirroring the
// approach in src/music/metronome/metronome.ts.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  } else if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

export function playTone(frequency = 880, duration = 0.5, volume = 0.6): void {
  const audioCtx = getCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = "sine";
  osc.frequency.value = frequency;

  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.start(now);
  osc.stop(now + duration);
}

/** A soft, bell-like chime — used for meditation start/interval/end bells. */
export function playChime(): void {
  playTone(660, 1.6, 0.45);
  setTimeout(() => playTone(990, 1.8, 0.22), 120);
}

/** A short, insistent alarm — used when a countdown reaches zero. */
export function playAlarm(beeps = 3): void {
  for (let i = 0; i < beeps; i++) {
    setTimeout(() => playTone(880, 0.22, 0.7), i * 340);
  }
}
