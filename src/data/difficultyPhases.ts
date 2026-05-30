import type { DifficultyPhase } from '../core/types';

/**
 * Five-phase ramp from cozy to chaotic. Section 10 of the dev plan.
 *
 * spawnInterval is in seconds; spawnVariance is +/- jitter applied at spawn.
 * maxConcurrent caps simultaneous on-screen balloons so the early game stays
 * gentle even if the player ignores them.
 */
export const DIFFICULTY_PHASES: DifficultyPhase[] = [
  {
    id: 1,
    name: 'Cozy Start',
    startTime: 0,
    spawnInterval: 1.1,
    spawnVariance: 0.35,
    maxConcurrent: 7,
    enabledTypes: ['normal'],
    enabledHazards: [],
  },
  {
    id: 2,
    name: 'Getting Busy',
    startTime: 20,
    spawnInterval: 0.75,
    spawnVariance: 0.25,
    maxConcurrent: 10,
    enabledTypes: ['normal', 'fast'],
    enabledHazards: [],
  },
  {
    id: 3,
    name: 'First Trouble',
    startTime: 60,
    spawnInterval: 0.62,
    spawnVariance: 0.22,
    maxConcurrent: 12,
    enabledTypes: ['normal', 'fast', 'tiny', 'tank'],
    enabledHazards: ['windstorm'],
  },
  {
    id: 4,
    name: 'Cloudy Chaos',
    startTime: 110,
    spawnInterval: 0.52,
    spawnVariance: 0.18,
    maxConcurrent: 14,
    enabledTypes: ['normal', 'fast', 'tiny', 'golden', 'tank'],
    enabledHazards: ['windstorm', 'cloudCover', 'birthdayRush'],
  },
  {
    id: 5,
    name: 'Party Panic',
    startTime: 180,
    spawnInterval: 0.4,
    spawnVariance: 0.15,
    maxConcurrent: 16,
    enabledTypes: ['normal', 'fast', 'tiny', 'golden', 'fineRisk', 'tank'],
    enabledHazards: ['windstorm', 'cloudCover', 'birthdayRush'],
  },
];

export function phaseAt(elapsedSeconds: number): DifficultyPhase {
  let active = DIFFICULTY_PHASES[0];
  for (const p of DIFFICULTY_PHASES) {
    if (elapsedSeconds >= p.startTime) active = p;
  }
  return active;
}
