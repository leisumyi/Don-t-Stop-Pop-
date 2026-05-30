import { describe, expect, it } from 'vitest';
import { StateMachine } from '../src/core/StateMachine';

describe('StateMachine', () => {
  it('starts in BOOT', () => {
    const sm = new StateMachine();
    expect(sm.state).toBe('BOOT');
  });

  it('transitions BOOT -> RUNNING', () => {
    const sm = new StateMachine();
    expect(sm.transition('RUNNING')).toBe(true);
    expect(sm.state).toBe('RUNNING');
  });

  it('rejects illegal transitions', () => {
    const sm = new StateMachine();
    sm.transition('RUNNING');
    expect(sm.transition('BOOT')).toBe(false);
    expect(sm.state).toBe('RUNNING');
  });

  it('SHOP_OPEN can return to RUNNING', () => {
    const sm = new StateMachine();
    sm.transition('RUNNING');
    sm.transition('SHOP_OPEN');
    sm.transition('RUNNING');
    expect(sm.state).toBe('RUNNING');
  });

  it('FAILED can transition back to RUNNING', () => {
    const sm = new StateMachine();
    sm.transition('RUNNING');
    sm.transition('FAILED');
    sm.transition('RUNNING');
    expect(sm.state).toBe('RUNNING');
  });

  it('emits change events with previous state', () => {
    const sm = new StateMachine();
    let prev: string | null = null;
    sm.onChange((_, p) => {
      prev = p;
    });
    sm.transition('RUNNING');
    expect(prev).toBe('BOOT');
  });
});
