import type { GameStore } from '../core/GameStore';

export interface MainMenuCallbacks {
  onStart: () => void;
  onGoodyBag: () => void;
}

/**
 * Starting-menu invitation card overlay (DOM). Shows a "You're Invited!" party
 * invitation with a Start Game button and a hanging gift-tag that displays the
 * player's best single-run pop count.
 *
 * The 3D back-garden party scene lives separately in PartyScene; this class
 * owns only the foreground invitation UI and its open/exit animations.
 */
export class MainMenu {
  private overlay: HTMLElement | null = null;
  private card: HTMLElement | null = null;
  private startBtn: HTMLButtonElement | null = null;
  private goodyBtn: HTMLButtonElement | null = null;
  private isOpen = false;
  private starting = false;

  constructor(
    private store: GameStore,
    private callbacks: MainMenuCallbacks,
  ) {}

  open(opts?: { paused?: boolean }): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.starting = false;

    const paused = opts?.paused ?? false;
    const best = this.store.save.data.persistent.highestPopsInRun;
    const buttonLabel = paused ? 'Resume Game' : 'Start Game';
    const sub = paused
      ? 'Your party is paused. Pick up right where you left off.'
      : 'Pop as many balloons as you can before they float away.';

    const overlay = document.createElement('div');
    overlay.className = 'main-menu-overlay';
    overlay.innerHTML = `
      <div class="invite-card">
        <div class="gift-tag">
          <span class="gift-tag-label">Best Run:</span>
          <span class="gift-tag-value">${formatPops(best)} Pops</span>
        </div>
        <div class="invite-eyebrow">A Balloon-Popping Party</div>
        <h1 class="invite-headline">Don't Stop Pop!</h1>
        <div class="invite-sub">${sub}</div>
        <button type="button" class="invite-start-button">${buttonLabel}</button>
        <button type="button" class="invite-goody-button">Goody Bag</button>
      </div>`;

    this.overlay = overlay;
    this.card = overlay.querySelector('.invite-card');
    this.startBtn = overlay.querySelector('.invite-start-button');
    this.goodyBtn = overlay.querySelector('.invite-goody-button');
    this.startBtn?.addEventListener('click', () => this.handleStart());
    this.goodyBtn?.addEventListener('click', () => this.callbacks.onGoodyBag());

    document.getElementById('ui-root')!.appendChild(overlay);
  }

  private handleStart(): void {
    if (this.starting) return;
    this.starting = true;
    // tactile press feedback
    this.startBtn?.classList.add('pressed');
    this.callbacks.onStart();
  }

  /**
   * Plays the card fly-off animation and resolves when it finishes, so callers
   * can chain the camera pan afterwards.
   */
  playStartAnimation(): Promise<void> {
    return new Promise((resolve) => {
      const card = this.card;
      if (!card) {
        resolve();
        return;
      }
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      card.addEventListener('animationend', finish, { once: true });
      card.classList.add('flying-out');
      // safety fallback if animationend doesn't fire
      setTimeout(finish, 700);
    });
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.overlay?.remove();
    this.overlay = null;
    this.card = null;
    this.startBtn = null;
    this.goodyBtn = null;
  }
}

function formatPops(n: number): string {
  return Math.max(0, Math.floor(n)).toLocaleString();
}
