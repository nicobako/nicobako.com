export interface CountdownTickEvent {
  remainingMs: number;
}

export type CountdownTickHandler = (event: CountdownTickEvent) => void;
export type CountdownCompleteHandler = () => void;

/**
 * A pause/resume-safe countdown. Tracks an absolute end time (rather than
 * decrementing a counter on each tick) so the displayed time stays accurate
 * even if the tab is throttled in the background.
 */
export class Countdown {
  private endTime = 0;
  private remainingAtPause = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;

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
    this.remainingAtPause = 0;
    this.intervalId = setInterval(() => this.tick(), 200);
    this.tick();
  }

  pause(): void {
    if (!this.isRunning) return;
    this.remainingAtPause = Math.max(0, this.endTime - Date.now());
    clearInterval(this.intervalId!);
    this.intervalId = null;
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
