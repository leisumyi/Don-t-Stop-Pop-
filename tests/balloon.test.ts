import { describe, expect, it } from 'vitest';
import { BALLOONS } from '../src/data/balloons';

describe('Tank balloon config', () => {
  it('requires three hits to pop', () => {
    expect(BALLOONS.tank.hitsToPop).toBe(3);
  });

  it('is larger and slower than normal balloons', () => {
    expect(BALLOONS.tank.radius).toBeGreaterThan(BALLOONS.normal.radius);
    expect(BALLOONS.tank.speedMax).toBeLessThan(BALLOONS.normal.speedMin);
  });

  it('has double the reward and higher escape pressure than fineRisk', () => {
    expect(BALLOONS.tank.reward).toBe(BALLOONS.fineRisk.reward * 2);
    expect(BALLOONS.tank.escapeValue).toBeGreaterThan(BALLOONS.fineRisk.escapeValue);
  });
});
