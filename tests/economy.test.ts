import { describe, expect, it } from 'vitest';
import {
  applyPartyMultiplier,
  calculatePartyBucks,
  calculatePrestigeGain,
  comboMultiplier,
  PRESTIGE_UNLOCK_THRESHOLD,
} from '../src/core/Economy';

describe('Economy.comboMultiplier', () => {
  it('returns 1 for combos below 5', () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(4)).toBe(1);
  });
  it('jumps to 1.1 at x5', () => {
    expect(comboMultiplier(5)).toBe(1.1);
    expect(comboMultiplier(9)).toBe(1.1);
  });
  it('jumps to 1.25 at x10', () => {
    expect(comboMultiplier(10)).toBe(1.25);
    expect(comboMultiplier(24)).toBe(1.25);
  });
  it('jumps to 1.5 at x25', () => {
    expect(comboMultiplier(25)).toBe(1.5);
    expect(comboMultiplier(50)).toBe(1.5);
  });
});

describe('Economy.applyPartyMultiplier', () => {
  it('scales base by 1+mult', () => {
    expect(applyPartyMultiplier(10, 0)).toBe(10);
    expect(applyPartyMultiplier(10, 0.5)).toBe(15);
    expect(applyPartyMultiplier(10, 1)).toBe(20);
  });
});

describe('Economy.calculatePartyBucks', () => {
  it('with no combo + no multiplier returns base', () => {
    expect(calculatePartyBucks(1, 0, 0)).toBe(1);
  });
  it('combos and multipliers stack', () => {
    // base 10, combo x10 (1.25), partyMult 0.5 -> 10 * 1.25 * 1.5 = 18.75
    expect(calculatePartyBucks(10, 10, 0.5)).toBeCloseTo(18.75);
  });
  it('extra bonus multiplier is applied', () => {
    expect(calculatePartyBucks(10, 0, 0, 1.1)).toBeCloseTo(11);
  });
});

describe('Economy.calculatePrestigeGain', () => {
  it('returns 0 below the unlock threshold', () => {
    expect(calculatePrestigeGain(0)).toBe(0);
    expect(calculatePrestigeGain(PRESTIGE_UNLOCK_THRESHOLD - 1)).toBe(0);
  });
  it('matches Section 14 examples', () => {
    expect(calculatePrestigeGain(3000)).toBeCloseTo(0.05);
    expect(calculatePrestigeGain(4000)).toBeCloseTo(0.1);
    expect(calculatePrestigeGain(9000)).toBeCloseTo(0.15);
    expect(calculatePrestigeGain(25000)).toBeCloseTo(0.25);
    expect(calculatePrestigeGain(100000)).toBeCloseTo(0.5);
  });
});
