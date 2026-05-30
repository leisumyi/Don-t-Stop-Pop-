import * as THREE from 'three';
import { Balloon } from './Balloon';
import type { ParticleSystem } from './ParticleSystem';
import { ALL_BALLOON_TYPES } from '../data/balloons';
import type { BalloonTypeId } from '../core/types';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../three/constants';

const MENU_TOP_Y = -LOGICAL_HEIGHT / 2; // -480: menu/gameplay boundary
const MENU_BOTTOM_Y = -LOGICAL_HEIGHT * 1.5; // -1440: bottom of the menu view

const MAX_CONCURRENT = 6;
const SPAWN_MIN = 1.2;
const SPAWN_MAX = 2.2;
const RISE_SPEED_MIN = 25;
const RISE_SPEED_MAX = 40;
const CONFETTI_MIN = 0.7;
const CONFETTI_MAX = 1.1;

const CONFETTI_ACCENTS = [0xff8fb1, 0xffd966, 0xa3e4c8, 0xc8b6ff, 0xff9e7d, 0xffffff];

/**
 * Ambient decoration for the starting menu: balloons (reusing the in-game
 * Balloon visuals) that drift slowly up the menu frame and can be popped for a
 * pop sound + confetti burst, plus gentle drifting confetti. Purely cosmetic -
 * popping here does not touch score, combo, or the escape meter.
 */
export class MenuBalloons {
  private balloons: Balloon[] = [];
  private active = false;
  private spawnTimer = 0;
  private confettiTimer = 0;

  constructor(
    private group: THREE.Group,
    private particles: ParticleSystem,
    private onPopSound: (type: BalloonTypeId) => void,
  ) {}

  start(): void {
    if (this.active) return;
    this.active = true;
    this.spawnTimer = 0.3;
    this.confettiTimer = CONFETTI_MIN;
  }

  stop(): void {
    this.active = false;
    for (const b of this.balloons) {
      this.group.remove(b.mesh);
      b.dispose();
    }
    this.balloons.length = 0;
  }

  update(dt: number): void {
    // Tick + cull existing balloons regardless of `active` so any in-flight
    // pop animations finish cleanly.
    for (const b of this.balloons) {
      b.update(dt, 1, 0);
    }
    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const b = this.balloons[i];
      const offTop = !b.popped && b.position.y > MENU_TOP_Y + b.halfHeight + 40;
      if (b.toRemove || offTop) {
        this.group.remove(b.mesh);
        b.dispose();
        this.balloons.splice(i, 1);
      }
    }

    if (!this.active) return;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      if (this.balloons.length < MAX_CONCURRENT) this.spawn();
      this.spawnTimer = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
    }

    this.confettiTimer -= dt;
    if (this.confettiTimer <= 0) {
      this.spawnAmbientConfetti();
      this.confettiTimer = CONFETTI_MIN + Math.random() * (CONFETTI_MAX - CONFETTI_MIN);
    }
  }

  private spawn(): void {
    const type = ALL_BALLOON_TYPES[(Math.random() * ALL_BALLOON_TYPES.length) | 0];
    const balloon = new Balloon(type);
    const margin = balloon.halfWidth + 8;
    const x = Math.random() * (LOGICAL_WIDTH - margin * 2) - (LOGICAL_WIDTH / 2 - margin);
    const y = MENU_BOTTOM_Y - balloon.halfHeight;
    balloon.setStartPosition(x, y);
    const speed = RISE_SPEED_MIN + Math.random() * (RISE_SPEED_MAX - RISE_SPEED_MIN);
    balloon.setVelocity(0, speed);
    this.balloons.push(balloon);
    this.group.add(balloon.mesh);
  }

  private spawnAmbientConfetti(): void {
    const x = (Math.random() - 0.5) * LOGICAL_WIDTH;
    const y = MENU_TOP_Y - 40 - Math.random() * 240;
    const accent = CONFETTI_ACCENTS[(Math.random() * CONFETTI_ACCENTS.length) | 0];
    this.particles.spawnBurst(x, y, 1, accent);
  }

  /** Pop the topmost balloon at the given world point. Cosmetic only. */
  popAt(wx: number, wy: number): boolean {
    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const b = this.balloons[i];
      if (b.popped) continue;
      if (b.hitTest(wx, wy)) {
        b.pop();
        this.particles.spawnBurst(b.position.x, b.position.y, 1.4, b.config.color);
        this.onPopSound(b.type);
        return true;
      }
    }
    return false;
  }
}
