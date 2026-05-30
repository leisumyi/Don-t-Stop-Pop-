import type { DifficultyPhase } from '../core/types';
import { DIFFICULTY_PHASES, phaseAt } from '../data/difficultyPhases';

/**
 * Progresses the run through the 5 difficulty phases. Provides the active
 * phase to BalloonManager + HazardManager each frame.
 */
export class DifficultyManager {
  private elapsedSec = 0;
  private current: DifficultyPhase = DIFFICULTY_PHASES[0];
  private earlySoftening = 0;

  setEarlySoftening(value: number): void {
    this.earlySoftening = value;
  }

  start(_now: number): void {
    this.elapsedSec = 0;
    this.current = DIFFICULTY_PHASES[0];
  }

  update(dt: number): void {
    let effectiveDt = dt;
    if (this.elapsedSec < 60 && this.earlySoftening > 0) {
      effectiveDt *= 1 - this.earlySoftening;
    }
    this.elapsedSec += effectiveDt;
    this.current = phaseAt(this.elapsedSec);
  }

  get phase(): DifficultyPhase {
    return this.current;
  }

  get elapsed(): number {
    return this.elapsedSec;
  }

  /** For UI: the next phase coming up, if any. */
  get nextPhase(): DifficultyPhase | null {
    const idx = DIFFICULTY_PHASES.findIndex((p) => p.id === this.current.id);
    return idx + 1 < DIFFICULTY_PHASES.length ? DIFFICULTY_PHASES[idx + 1] : null;
  }

  /**
   * Continuous within-phase ramp for balloon travel speed. Sits on top of the
   * discrete phase steps so progression keeps building even mid-phase. Caps so
   * late-game doesn't become unreadable.
   */
  getProgressionSpeedFactor(): number {
    const t = this.elapsedSec;
    // Ramp quickly through phase 1 (20s), then keep building speed.
    if (t <= 20) return 1 + (t / 20) * 0.35;
    if (t <= 50) return 1.35 + ((t - 20) / 30) * 0.5;
    if (t <= 150) return 1.85 + ((t - 50) / 100) * 0.25;
    return 2.1;
  }

  /**
   * Continuous within-phase ramp for spawn frequency (higher = spawns faster).
   * Stacks multiplicatively with birthday-rush's rushSpawnMultiplier.
   */
  getProgressionSpawnFactor(): number {
    const t = this.elapsedSec;
    if (t <= 45) return 1 + (t / 45) * 0.55;
    if (t <= 150) return 1.55 + ((t - 45) / 105) * 0.3;
    return 1.85;
  }

  reset(): void {
    this.elapsedSec = 0;
    this.current = DIFFICULTY_PHASES[0];
  }
}
