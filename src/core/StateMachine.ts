import type { GameStateName } from './types';

export type StateTransition = {
  from: GameStateName | '*';
  to: GameStateName;
};

const ALLOWED: StateTransition[] = [
  { from: 'BOOT', to: 'MAIN_MENU' },
  { from: 'BOOT', to: 'TUTORIAL' },
  { from: 'BOOT', to: 'RUNNING' },
  { from: 'MAIN_MENU', to: 'TUTORIAL' },
  { from: 'MAIN_MENU', to: 'RUNNING' },
  { from: 'TUTORIAL', to: 'RUNNING' },
  { from: 'RUNNING', to: 'PAUSED' },
  { from: 'RUNNING', to: 'SHOP_OPEN' },
  { from: 'RUNNING', to: 'STAMP_CARD_OPEN' },
  { from: 'RUNNING', to: 'PRESTIGE_CONFIRM' },
  { from: 'RUNNING', to: 'FAILED' },
  { from: 'RUNNING', to: 'MAIN_MENU' },
  { from: 'SHOP_OPEN', to: 'MAIN_MENU' },
  { from: 'STAMP_CARD_OPEN', to: 'MAIN_MENU' },
  { from: 'PRESTIGE_CONFIRM', to: 'MAIN_MENU' },
  { from: 'PAUSED', to: 'RUNNING' },
  { from: 'PAUSED', to: 'STAMP_CARD_OPEN' },
  { from: 'PAUSED', to: 'SHOP_OPEN' },
  { from: 'SHOP_OPEN', to: 'RUNNING' },
  { from: 'SHOP_OPEN', to: 'PAUSED' },
  { from: 'STAMP_CARD_OPEN', to: 'RUNNING' },
  { from: 'STAMP_CARD_OPEN', to: 'PAUSED' },
  { from: 'STAMP_CARD_OPEN', to: 'FAILED' },
  { from: 'PRESTIGE_CONFIRM', to: 'RUNNING' },
  { from: 'PRESTIGE_CONFIRM', to: 'FAILED' },
  { from: 'FAILED', to: 'RUNNING' },
  { from: 'FAILED', to: 'STAMP_CARD_OPEN' },
  { from: 'FAILED', to: 'SHOP_OPEN' },
  { from: 'FAILED', to: 'PRESTIGE_CONFIRM' },
];

export class StateMachine {
  private current: GameStateName = 'BOOT';
  private listeners = new Set<(s: GameStateName, prev: GameStateName) => void>();

  get state(): GameStateName {
    return this.current;
  }

  canTransition(to: GameStateName): boolean {
    return ALLOWED.some((t) => (t.from === '*' || t.from === this.current) && t.to === to);
  }

  transition(to: GameStateName): boolean {
    if (to === this.current) return false;
    if (!this.canTransition(to)) {
      console.warn(`[StateMachine] illegal transition ${this.current} -> ${to}`);
      return false;
    }
    const prev = this.current;
    this.current = to;
    this.listeners.forEach((fn) => fn(this.current, prev));
    return true;
  }

  onChange(fn: (s: GameStateName, prev: GameStateName) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  isAny(...states: GameStateName[]): boolean {
    return states.includes(this.current);
  }
}
