import type { BalloonTypeId, RunStats } from './types';
import { HAZARD_ZERO_COUNT, makeEmptyByType } from './SaveSystem';

export function emptyRunStats(now: number): RunStats {
  return {
    startTime: now,
    elapsed: 0,
    popsTotal: 0,
    popsByType: makeEmptyByType<number>(0),
    partyBucksEarned: 0,
    shopItemsPurchased: 0,
    instantsUsed: 0,
    hazardsSurvived: [],
    popsDuringHazard: HAZARD_ZERO_COUNT(),
    bestCombo: 0,
    toolsOwned: 0,
  };
}

/**
 * Pure economy helpers. Anything tied to scoring, rewards, prestige math, or
 * combo multipliers should live here so it can be unit-tested without DOM.
 */

export function comboMultiplier(combo: number): number {
  if (combo >= 25) return 1.5;
  if (combo >= 10) return 1.25;
  if (combo >= 5) return 1.1;
  return 1;
}

export function applyPartyMultiplier(base: number, partyMultiplier: number): number {
  return base * (1 + partyMultiplier);
}

export function calculatePartyBucks(
  baseReward: number,
  combo: number,
  partyMultiplier: number,
  bonusMultipliers: number = 1,
): number {
  const withCombo = baseReward * comboMultiplier(combo);
  const withParty = applyPartyMultiplier(withCombo, partyMultiplier);
  return Math.max(0, withParty * bonusMultipliers);
}

/**
 * Section 14 formula: prestigeGain = floor(sqrt(currentPartyBucks/1000)) * 0.05
 * The "* 0.05" returns a fractional bonus (0.05 = +5%).
 */
export function calculatePrestigeGain(currentPartyBucks: number): number {
  if (currentPartyBucks < PRESTIGE_UNLOCK_THRESHOLD) return 0;
  return Math.floor(Math.sqrt(currentPartyBucks / 1000)) * 0.05;
}

export const PRESTIGE_UNLOCK_THRESHOLD = 3000;

export function popsByTypeIncrement(
  stats: Record<BalloonTypeId, number>,
  type: BalloonTypeId,
  by = 1,
): void {
  stats[type] = (stats[type] ?? 0) + by;
}
