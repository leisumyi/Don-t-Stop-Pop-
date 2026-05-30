import type { GameStore } from '../core/GameStore';
import type { PrestigeSystem } from '../systems/PrestigeSystem';

/**
 * Confirmation modal shown when the player taps "Buy a New Party!".
 */
export class PrestigePanel {
  private overlay: HTMLElement | null = null;
  private isOpen = false;

  constructor(
    private store: GameStore,
    private prestige: PrestigeSystem,
    private onConfirm: () => void,
    private onCancel: () => void,
  ) {}

  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    const gainPct = Math.round(this.prestige.pendingGain() * 100);
    const currentMult = Math.round(this.store.save.data.partyMultiplier * 100);
    const ov = document.createElement('div');
    ov.className = 'modal-scrim';
    ov.innerHTML = `
      <div class="modal-card">
        <h2>Buy a New Party!</h2>
        <div class="modal-text">Cash out your current party.\nKeep all badges, cosmetics, sticker shine, and permanent boosts.\nYour Party Multiplier rises and your run resets.</div>
        <div class="modal-stats">
          <span class="stat-label">Current Party Bucks</span><span class="stat-value">${Math.floor(this.store.run.partyBucks).toLocaleString()}</span>
          <span class="stat-label">Current Multiplier</span><span class="stat-value">+${currentMult}%</span>
          <span class="stat-label">This cash-out</span><span class="stat-value">+${gainPct}%</span>
          <span class="stat-label">After cash-out</span><span class="stat-value">+${currentMult + gainPct}%</span>
        </div>
        <div class="modal-buttons">
          <button class="modal-button gold" data-act="confirm">Cash Out!</button>
          <button class="modal-button subtle" data-act="cancel">Keep Playing</button>
        </div>
      </div>`;
    ov.querySelectorAll<HTMLButtonElement>('.modal-button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        this.close();
        if (act === 'confirm') this.onConfirm();
        else this.onCancel();
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
