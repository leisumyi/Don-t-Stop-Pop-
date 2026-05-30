import type { GameStore } from '../core/GameStore';

const STEP_TEXTS = [
  'Tap balloons before they float away!',
  'Pops earn Party Bucks.',
  'Buy helpers when the party gets busy.',
];

/**
 * Tiny 3-step tutorial. Only shown to first-time players.
 *
 * Step 1 advances on the first pop, Step 2 advances after the player sees a
 * Party Bucks gain, Step 3 highlights the shop button until tapped.
 */
export class TutorialOverlay {
  private overlay: HTMLElement | null = null;
  private bubble: HTMLElement | null = null;
  private step = 0;
  private active = false;
  private resolveDone?: () => void;
  private highlightedShopBtn = false;
  private shopHighlightStyleEl: HTMLStyleElement | null = null;

  constructor(private store: GameStore) {}

  shouldRun(): boolean {
    return !this.store.save.data.tutorialCompleted;
  }

  start(): Promise<void> {
    if (this.active) return Promise.resolve();
    this.active = true;
    this.step = 0;
    return new Promise<void>((resolve) => {
      this.resolveDone = resolve;
      this.show();
      // step advancement is driven by external events
      this.subscribe();
    });
  }

  private show(): void {
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'tutorial-overlay';
      this.bubble = document.createElement('div');
      this.bubble.className = 'tutorial-bubble';
      this.overlay.appendChild(this.bubble);
      document.getElementById('ui-root')!.appendChild(this.overlay);
    }
    if (this.bubble) this.bubble.textContent = STEP_TEXTS[this.step];
  }

  private subscribe(): void {
    const offPop = this.store.bus.on('pop:registered', () => {
      if (!this.active) return;
      if (this.step === 0) {
        this.advance();
      } else if (this.step === 1) {
        // Step 2 (Party Bucks visible) auto-advances after first pop confirmation
        setTimeout(() => this.advance(), 700);
      }
    });
    const offShop = this.store.bus.on('state:change', () => {
      if (this.active && this.step === 2) {
        // Stop advancing on shop open; finalize tutorial
        this.advance();
      }
    });
    // store these on instance so we can detach when done
    (this as any)._offPop = offPop;
    (this as any)._offShop = offShop;
  }

  private advance(): void {
    this.step += 1;
    if (this.step >= STEP_TEXTS.length) {
      this.complete();
      return;
    }
    if (this.bubble) this.bubble.textContent = STEP_TEXTS[this.step];
    if (this.step === 2) this.highlightShop();
  }

  private highlightShop(): void {
    if (this.highlightedShopBtn) return;
    this.highlightedShopBtn = true;
    const btn = document.querySelector('.nav-button:nth-child(1)') as HTMLElement;
    if (!btn) return;
    btn.style.position = 'relative';
    btn.style.boxShadow = '0 0 0 4px var(--color-accent-pink)';
    const style = document.createElement('style');
    style.textContent = `.nav-button:nth-child(1){animation:tutorial-pulse 1.2s infinite alternate var(--ease-soft);}
@keyframes tutorial-pulse{from{box-shadow:0 0 0 0 var(--color-accent-pink);}to{box-shadow:0 0 0 6px var(--color-accent-pink);}}`;
    document.head.appendChild(style);
    this.shopHighlightStyleEl = style;
  }

  private complete(): void {
    this.active = false;
    this.overlay?.remove();
    this.overlay = null;
    this.bubble = null;
    if (this.shopHighlightStyleEl) {
      this.shopHighlightStyleEl.remove();
      this.shopHighlightStyleEl = null;
    }
    if (this.highlightedShopBtn) {
      const btn = document.querySelector('.nav-button:nth-child(1)') as HTMLElement;
      if (btn) btn.style.boxShadow = '';
    }
    (this as any)._offPop?.();
    (this as any)._offShop?.();
    this.store.updateSave((s) => {
      s.tutorialCompleted = true;
    });
    this.resolveDone?.();
  }

  /** Force-skip the tutorial (e.g. via dev tools / reset). */
  skip(): void {
    if (!this.active) return;
    this.complete();
  }
}
