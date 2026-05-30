import { describe, expect, it } from 'vitest';
import { SHOP_ITEMS, shopCost } from '../src/data/upgrades';

describe('upgrades.shopCost', () => {
  it('matches the current base costs', () => {
    expect(shopCost('dartThrower', 0)).toBe(25);
    expect(shopCost('puppyUppies', 0)).toBe(75);
    expect(shopCost('cloudBlower', 0)).toBe(130);
    expect(shopCost('cakeFreeze', 0)).toBe(160);
    expect(shopCost('partyNet', 0)).toBe(200);
    expect(shopCost('comboRibbon', 0)).toBe(110);
  });

  it('scales the dart thrower cost between levels', () => {
    const c0 = shopCost('dartThrower', 0);
    const c1 = shopCost('dartThrower', 1);
    const c4 = shopCost('dartThrower', 4);
    expect(c1).toBeGreaterThan(c0);
    expect(c4).toBeGreaterThan(c1);
  });

  it('all shop items have unique ids', () => {
    const ids = new Set(SHOP_ITEMS.map((s) => s.id));
    expect(ids.size).toBe(SHOP_ITEMS.length);
  });

  it('dart thrower has 5 upgrade levels with decreasing intervals', () => {
    const dart = SHOP_ITEMS.find((s) => s.id === 'dartThrower')!;
    expect(dart.maxLevel).toBe(5);
    expect(dart.effectByLevel).toBeDefined();
    const intervals = [1, 2, 3, 4, 5].map((lvl) => dart.effectByLevel![lvl]);
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]).toBeLessThan(intervals[i - 1]);
    }
  });
});
