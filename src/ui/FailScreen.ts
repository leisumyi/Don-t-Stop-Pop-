import type { GameStore } from '../core/GameStore';
import type { PrestigeSystem } from '../systems/PrestigeSystem';
import { randomFailMessage } from '../data/failMessages';

export interface FailScreenCallbacks {
  onTryAgain: () => void;
  onStampCard: () => void;
  onPrestige: () => void;
}

export class FailScreen {
  private overlay: HTMLElement | null = null;
  private isOpen = false;

  constructor(
    _store: GameStore,
    private prestige: PrestigeSystem,
    private callbacks: FailScreenCallbacks,
  ) {}

  open(summary: { partyBucksLost: number; popsThisRun: number; secondsThisRun: number; badgesEarned: string[] }): void {
    if (this.isOpen) return;
    this.isOpen = true;
    const msg = randomFailMessage();
    const ov = document.createElement('div');
    ov.className = 'modal-scrim';
    ov.innerHTML = `
      <div class="modal-card">
        <h2>${msg.title}</h2>
        <div class="modal-text">${msg.body.replace(/\n/g, '<br>')}</div>
        <div class="modal-stats">
          <span class="stat-label">Party Bucks lost</span><span class="stat-value">${formatNum(summary.partyBucksLost)}</span>
          <span class="stat-label">Pops this run</span><span class="stat-value">${formatNum(summary.popsThisRun)}</span>
          <span class="stat-label">Time</span><span class="stat-value">${formatTime(summary.secondsThisRun)}</span>
          <span class="stat-label">Badges this run</span><span class="stat-value">${summary.badgesEarned.length}</span>
        </div>
        <div class="modal-buttons">
          <button class="modal-button primary" data-act="again">Try Again</button>
          <button class="modal-button" data-act="stamp">Goody Bag</button>
          ${this.prestige.isUnlocked()
            ? `<button class="modal-button gold" data-act="prestige">Buy a New Party! (+${Math.round(this.prestige.pendingGain() * 100)}% Mult)</button>`
            : `<button class="modal-button locked" disabled>New Party! (3k party bucks needed)</button>`}
        </div>
      </div>`;
    ov.querySelectorAll<HTMLButtonElement>('.modal-button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (!act) return;
        this.close();
        if (act === 'again') this.callbacks.onTryAgain();
        else if (act === 'stamp') this.callbacks.onStampCard();
        else if (act === 'prestige') this.callbacks.onPrestige();
      });
    });
    this.overlay = ov;
    document.getElementById('ui-root')!.appendChild(ov);
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.overlay?.remove();
    this.overlay = null;
  }
}

function formatNum(n: number): string {
  return Math.floor(n).toLocaleString();
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
