import * as THREE from 'three';
import { Balloon, type BalloonPaletteOverride } from './Balloon';
import { ALL_BALLOON_TYPES, BALLOONS } from '../data/balloons';
import type { BalloonTypeId, DifficultyPhase } from '../core/types';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../three/constants';

export interface SpawnRequest {
  type?: BalloonTypeId;
  x?: number;
}

/**
 * Spawns + ticks balloon instances. The DifficultyManager hands us the active
 * phase each frame; we use it to scale spawn rate, max concurrent, weighted
 * type pool, and the optional golden-chance bonus.
 */
export class BalloonManager {
  readonly balloons: Balloon[] = [];
  private group: THREE.Group;
  private spawnTimer = 0;
  private nextSpawnInterval = 1.6;
  private goldenChanceBonus = 0;
  private rushSpawnMultiplier = 1;
  private balloonPalette: BalloonPaletteOverride | null = null;

  // wind state
  windDirection: -1 | 0 | 1 = 0;
  windStrength = 0;

  // global speed multiplier (cake freeze)
  speedFactor = 1;

  // Continuous difficulty ramps from DifficultyManager. Kept separate from
  // speedFactor / rushSpawnMultiplier so hazards (cake freeze, birthday rush)
  // can mutate those independently without overwriting progression.
  progressionSpeedFactor = 1;
  progressionSpawnFactor = 1;

  constructor(group: THREE.Group) {
    this.group = group;
  }

  setPalette(palette: BalloonPaletteOverride | null): void {
    this.balloonPalette = palette;
    Balloon.clearTextureCache();
  }

  setGoldenChanceBonus(value: number): void {
    this.goldenChanceBonus = value;
  }

  setRushSpawnMultiplier(value: number): void {
    this.rushSpawnMultiplier = value;
  }

  setWind(direction: -1 | 0 | 1, strength: number): void {
    this.windDirection = direction;
    this.windStrength = direction * strength;
  }

  setGlobalSpeedFactor(factor: number): void {
    this.speedFactor = factor;
  }

  setProgressionMultipliers(speedMul: number, spawnRateMul: number): void {
    this.progressionSpeedFactor = speedMul;
    this.progressionSpawnFactor = spawnRateMul;
  }

  update(
    dt: number,
    phase: DifficultyPhase,
    onEscape: (b: Balloon) => void,
    allowSpawning = true,
  ): void {
    const effectiveSpeed = this.speedFactor * this.progressionSpeedFactor;
    // tick existing
    for (const b of this.balloons) {
      b.update(dt, effectiveSpeed, this.windStrength);
      const yLimit = LOGICAL_HEIGHT / 2 + b.halfHeight + 20;
      if (!b.popped && b.position.y > yLimit) {
        b.popped = true;
        b.toRemove = true;
        onEscape(b);
      }
    }
    this.cleanup();

    // spawn loop
    if (allowSpawning) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        if (this.balloons.length < phase.maxConcurrent) {
          this.spawn(phase);
        }
        this.scheduleNextSpawn(phase);
      }
    }
  }

  private cleanup(): void {
    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const b = this.balloons[i];
      if (b.toRemove) {
        this.group.remove(b.mesh);
        b.dispose();
        this.balloons.splice(i, 1);
      }
    }
  }

  private scheduleNextSpawn(phase: DifficultyPhase): void {
    const rateBoost =
      Math.max(0.5, this.rushSpawnMultiplier) * Math.max(0.5, this.progressionSpawnFactor);
    const baseInterval = phase.spawnInterval / rateBoost;
    const variance = phase.spawnVariance;
    this.nextSpawnInterval = Math.max(0.12, baseInterval + (Math.random() * 2 - 1) * variance);
    this.spawnTimer = this.nextSpawnInterval;
  }

  /** Manual spawn, mainly used for testing or special events. */
  spawn(phase: DifficultyPhase, request: SpawnRequest = {}): Balloon | null {
    const type = request.type ?? this.pickType(phase);
    if (!type) return null;
    const cfg = BALLOONS[type];
    const balloon = new Balloon(type, this.balloonPalette);
    const margin = balloon.halfWidth + 8;
    const x = request.x ?? (Math.random() * (LOGICAL_WIDTH - margin * 2) - (LOGICAL_WIDTH / 2 - margin));
    const y = -LOGICAL_HEIGHT / 2 - balloon.halfHeight - 20;
    balloon.setStartPosition(x, y);
    const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
    balloon.setVelocity(0, speed);
    this.balloons.push(balloon);
    this.group.add(balloon.mesh);
    return balloon;
  }

  private pickType(phase: DifficultyPhase): BalloonTypeId | null {
    const enabled = phase.enabledTypes.filter((t) => ALL_BALLOON_TYPES.includes(t));
    if (enabled.length === 0) return null;

    // Adjust golden weight if bonus active.
    let totalWeight = 0;
    const weights: { id: BalloonTypeId; w: number }[] = enabled.map((t) => {
      let w = BALLOONS[t].weight;
      if (t === 'golden') w += w * this.goldenChanceBonus;
      totalWeight += w;
      return { id: t, w };
    });

    let r = Math.random() * totalWeight;
    for (const e of weights) {
      r -= e.w;
      if (r <= 0) return e.id;
    }
    return weights[weights.length - 1].id;
  }

  /**
   * Pop any balloon at the world point. Returns the balloon if hit, else null.
   */
  popAt(wx: number, wy: number): Balloon | null {
    // iterate front-to-back so the topmost balloon is hit first
    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const b = this.balloons[i];
      if (b.popped) continue;
      if (b.hitTest(wx, wy)) {
        b.hit();
        return b;
      }
    }
    return null;
  }

  /**
   * Pick the highest-priority alive balloon for the Dart Thrower:
   * fineRisk > golden > fast > tiny > normal, then highest-on-screen.
   */
  pickPriorityTarget(): Balloon | null {
    const priority: Record<BalloonTypeId, number> = {
      tank: 6,
      fineRisk: 5,
      golden: 4,
      fast: 3,
      tiny: 2,
      normal: 1,
    };
    let best: Balloon | null = null;
    let bestKey = -Infinity;
    for (const b of this.balloons) {
      if (b.popped) continue;
      const key = priority[b.type] * 1000 + b.position.y; // higher = closer to escaping
      if (key > bestKey) {
        bestKey = key;
        best = b;
      }
    }
    return best;
  }

  /**
   * Pick the N lowest (bottom-most) alive balloons, used by Puppy Uppies which
   * leaps up from the bottom of the screen.
   */
  pickLowest(n: number): Balloon[] {
    return this.balloons
      .filter((b) => !b.popped)
      .sort((a, b) => a.position.y - b.position.y)
      .slice(0, n);
  }

  reduceMeterByEscapes(_amount: number): void {
    // placeholder hook for future tuning logic
  }

  popAll(): Balloon[] {
    const popped: Balloon[] = [];
    for (const b of this.balloons) {
      if (b.popped) continue;
      while (!b.popped) b.hit();
      if (b.justFullyPopped) popped.push(b);
    }
    return popped;
  }

  clear(): void {
    for (const b of this.balloons) {
      this.group.remove(b.mesh);
      b.dispose();
    }
    this.balloons.length = 0;
  }
}
