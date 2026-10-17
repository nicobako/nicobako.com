export interface CountdownTickEvent {
  remainingMs: number;
}

export type CountdownTickHandler = (event: CountdownTickEvent) => void;
export type CountdownCompleteHandler = () => void;

/**
 * A pause/resume-safe countdown. Tracks an absolute end time (rather than
 * decrementing a counter on each tick) so the displayed time stays accurate
 * even if the tab is throttled in the background.
 *
 * A hidden tab may run the repeating tick only once a minute, which would make
 * the finish — and its notification — up to a minute late. A single timeout for
 * the end time is not throttled that hard, so one is set alongside the interval.
 */
export class Countdown {
  private endTime = 0;
  private remainingAtPause = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly onTick: CountdownTickHandler,
    private readonly onComplete: CountdownCompleteHandler,
  ) {}

  get isRunning(): boolean {
    return this.intervalId !== null;
  }

  start(durationMs: number): void {
    this.pause();
    this.remainingAtPause = Math.max(0, durationMs);
    this.resume();
  }

  resume(): void {
    if (this.isRunning || this.remainingAtPause <= 0) return;
    this.endTime = Date.now() + this.remainingAtPause;
    this.timeoutId = setTimeout(() => this.tick(), this.remainingAtPause);
    this.remainingAtPause = 0;
    this.intervalId = setInterval(() => this.tick(), 200);
    this.tick();
  }

  pause(): void {
    if (!this.isRunning) return;
    this.remainingAtPause = Math.max(0, this.endTime - Date.now());
    clearInterval(this.intervalId!);
    clearTimeout(this.timeoutId!);
    this.intervalId = null;
    this.timeoutId = null;
  }

  reset(): void {
    this.pause();
    this.remainingAtPause = 0;
  }

  private tick(): void {
    const remainingMs = Math.max(0, this.endTime - Date.now());
    this.onTick({ remainingMs });
    if (remainingMs <= 0) {
      this.pause();
      this.onComplete();
    }
  }
}

export function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** A length of time as words short enough for a watch face: "1 hr 5 min", "45 sec". */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts = [h && `${h} hr`, m && `${m} min`, s && `${s} sec`].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "0 sec";
}
