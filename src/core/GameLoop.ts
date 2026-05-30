/**
 * Fixed-step game loop with a delta-time callback. Pauses automatically when
 * the document is hidden so background tabs don't accumulate huge dt spikes.
 */
export type LoopCallback = (dt: number, elapsedSec: number) => void;

export class GameLoop {
  private cb: LoopCallback;
  private rafId: number | null = null;
  private last = 0;
  private running = false;
  private elapsed = 0;
  private maxDt = 1 / 30; // clamp big stalls

  constructor(cb: LoopCallback) {
    this.cb = cb;
    this.tick = this.tick.bind(this);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  pause(): void {
    if (!this.running) return;
    this.running = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  resume(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.pause();
    this.elapsed = 0;
  }

  get isRunning(): boolean {
    return this.running;
  }

  private tick(now: number): void {
    if (!this.running) return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > this.maxDt) dt = this.maxDt;
    if (dt < 0) dt = 0;
    this.elapsed += dt;
    try {
      this.cb(dt, this.elapsed);
    } catch (err) {
      console.error('[GameLoop] callback threw', err);
    }
    this.rafId = requestAnimationFrame(this.tick);
  }
}
