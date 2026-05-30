import { describe, expect, it } from 'vitest';
import { FAIL_MESSAGES, randomFailMessage } from '../src/data/failMessages';

describe('fail messages', () => {
  it('has exactly 10 rotating messages', () => {
    expect(FAIL_MESSAGES).toHaveLength(10);
  });

  it('every message has a non-empty title and body', () => {
    for (const m of FAIL_MESSAGES) {
      expect(m.title.length).toBeGreaterThan(0);
      expect(m.body.length).toBeGreaterThan(0);
    }
  });

  it('all titles are unique', () => {
    const titles = new Set(FAIL_MESSAGES.map((m) => m.title));
    expect(titles.size).toBe(FAIL_MESSAGES.length);
  });

  it('randomFailMessage always returns a valid entry', () => {
    for (let i = 0; i < 50; i++) {
      const m = randomFailMessage();
      expect(FAIL_MESSAGES).toContain(m);
    }
  });
});
