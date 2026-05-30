import { describe, expect, it } from 'vitest';
import { BALLOONS, ESCAPE_METER_BASE_MAX } from '../src/data/balloons';
import { SHOP_ITEMS } from '../src/data/upgrades';
import { PRESTIGE_UNLOCK_THRESHOLD } from '../src/core/Economy';
import { PERMANENT_BOOSTS } from '../src/data/boosts';

/**
 * Locks in the Section 27 "Suggested Balancing Defaults" so a future tweak is
 * an explicit, intentional change rather than a silent regression.
 */
describe('Section 27 balance defaults', () => {
  it('balloon rewards match the plan', () => {
    expect(BALLOONS.normal.reward).toBe(1);
    expect(BALLOONS.fast.reward).toBe(2);
    expect(BALLOONS.golden.reward).toBe(10);
    expect(BALLOONS.tiny.reward).toBe(3);
    expect(BALLOONS.fineRisk.reward).toBe(8);
    expect(BALLOONS.tank.reward).toBe(16);
  });

  it('balloon escape values match the plan', () => {
    expect(BALLOONS.normal.escapeValue).toBe(1);
    expect(BALLOONS.fast.escapeValue).toBe(2);
    expect(BALLOONS.golden.escapeValue).toBe(2);
    expect(BALLOONS.tiny.escapeValue).toBe(1);
    expect(BALLOONS.fineRisk.escapeValue).toBe(5);
    expect(BALLOONS.tank.escapeValue).toBe(8);
  });

  it('escape meter max is 20', () => {
    expect(ESCAPE_METER_BASE_MAX).toBe(20);
  });

  it('prestige unlock threshold is 3000', () => {
    expect(PRESTIGE_UNLOCK_THRESHOLD).toBe(3000);
  });

  it('starter shop pricing matches the plan', () => {
    const cost = (id: string) => SHOP_ITEMS.find((s) => s.id === id)!.baseCost;
    expect(cost('dartThrower')).toBe(25);
    expect(cost('puppyUppies')).toBe(75);
    expect(cost('cloudBlower')).toBe(130);
    expect(cost('cakeFreeze')).toBe(160);
    expect(cost('partyNet')).toBe(200);
    expect(cost('comboRibbon')).toBe(110);
  });

  it('dart thrower fire intervals match the plan progression', () => {
    const dart = SHOP_ITEMS.find((s) => s.id === 'dartThrower')!;
    expect(dart.effectByLevel).toEqual({ 1: 5.0, 2: 4.0, 3: 3.0, 4: 2.25, 5: 1.5 });
  });

  it('permanent boosts stay within the 8-12 design band', () => {
    expect(PERMANENT_BOOSTS.length).toBeGreaterThanOrEqual(8);
    expect(PERMANENT_BOOSTS.length).toBeLessThanOrEqual(12);
  });

  it('every balloon has a sane speed range', () => {
    for (const b of Object.values(BALLOONS)) {
      expect(b.speedMin).toBeGreaterThan(0);
      expect(b.speedMax).toBeGreaterThanOrEqual(b.speedMin);
    }
  });
});
