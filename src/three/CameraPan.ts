import type * as THREE from 'three';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Small single-axis camera tween. Interpolates the camera's y position from a
 * start to an end value over a duration using easeOutCubic, so the menu-to-
 * gameplay reveal feels smooth and cinematic rather than snappy.
 */
export class CameraPan {
  private camera: THREE.OrthographicCamera;
  private from = 0;
  private to = 0;
  private duration = 1;
  private elapsed = 0;
  private active = false;
  private onDone: (() => void) | null = null;

  constructor(camera: THREE.OrthographicCamera) {
    this.camera = camera;
  }

  get isAnimating(): boolean {
    return this.active;
  }

  /** Immediately position the camera at a given y (no tween). */
  setY(y: number): void {
    this.active = false;
    this.onDone = null;
    this.camera.position.y = y;
  }

  start(from: number, to: number, duration: number, onDone?: () => void): void {
    this.from = from;
    this.to = to;
    this.duration = Math.max(0.0001, duration);
    this.elapsed = 0;
    this.active = true;
    this.onDone = onDone ?? null;
    this.camera.position.y = from;
  }

  update(dt: number): void {
    if (!this.active) return;
    this.elapsed += dt;
    const t = Math.min(this.elapsed / this.duration, 1);
    this.camera.position.y = this.from + (this.to - this.from) * easeOutCubic(t);
    if (t >= 1) {
      this.camera.position.y = this.to;
      this.active = false;
      const cb = this.onDone;
      this.onDone = null;
      cb?.();
    }
  }
}
