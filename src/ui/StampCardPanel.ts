import type { GameStore } from '../core/GameStore';
import type { BadgeSystem } from '../systems/BadgeSystem';
import type { CosmeticSystem } from '../systems/CosmeticSystem';
import type { BoostSystem } from '../systems/BoostSystem';
import type { SoundSystem } from '../core/SoundSystem';
import { BADGES, BADGE_PLACEHOLDER, badgesByCategory } from '../data/badges';
import { COSMETICS } from '../data/cosmetics';
import type { BadgeConfig, CosmeticCategory } from '../core/types';

type Tab = 'badges' | 'cosmetics' | 'boosts';

const SCRUB_COOLDOWN_MS = 120;

export class StampCardPanel {
  private overlay: HTMLElement | null = null;
  private isOpen = false;
  private tab: Tab = 'badges';
  private lastScrubTime = 0;
  private cleanedPopup: HTMLElement | null = null;
  private cleanedPopupTimer: ReturnType<typeof setTimeout> | null = null;
  /** Suppresses render during active cleaning so the cell isn't destroyed mid-tap. */
  private cleaningInProgress = false;

  constructor(
    private store: GameStore,
    private badges: BadgeSystem,
    private cosmetics: CosmeticSystem,
    private boosts: BoostSystem,
    private sound: SoundSystem,
    private onClose: () => void,
  ) {
    this.store.bus.on('stickerShine:change', () => {
      if (this.isOpen && !this.cleaningInProgress) this.render();
    });
    this.store.bus.on('badge:unlock', () => {
      if (this.isOpen) this.render();
    });
    this.cosmetics.onChange(() => {
      if (this.isOpen) {
        this.applyStampCardTheme();
        this.render();
      }
    });
  }

  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.overlay = document.createElement('div');
    this.overlay.className = 'panel-overlay';
    this.overlay.innerHTML = `
      <div class="goody-bag-wrap">
        <div class="goody-bag-handle" aria-hidden="true"></div>
      <div class="panel-card">
        <div class="panel-header">
          <h2>Goody Bag</h2>
          <button class="panel-close" aria-label="Close">x</button>
        </div>
        <div class="panel-tabs" style="display:flex;gap:6px;padding:8px 16px 0;">
          <button data-tab="badges" class="tab-btn">Badges</button>
          <button data-tab="cosmetics" class="tab-btn">Cosmetics</button>
          <button data-tab="boosts" class="tab-btn">Boosts</button>
        </div>
        <div class="panel-body" id="stamp-body"></div>
      </div>
      </div>`;
    this.overlay.querySelector('.panel-close')!.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
    this.overlay.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.tab = (btn as HTMLElement).dataset.tab as Tab;
        this.render();
      });
    });
    this.overlay.querySelectorAll('.tab-btn').forEach((btn) => {
      const el = btn as HTMLElement;
      el.style.cssText =
        'flex:1;padding:8px 10px;border-radius:14px;border:2px solid var(--color-paper-edge);background:rgba(255,255,255,0.6);font-weight:700;font-family:inherit;font-size:13px;cursor:pointer;';
    });
    document.getElementById('ui-root')!.appendChild(this.overlay);
    this.applyStampCardTheme();
    this.render();
  }

  private applyStampCardTheme(): void {
    const wrap = this.overlay?.querySelector('.goody-bag-wrap') as HTMLElement | null;
    if (!wrap) return;
    const id = this.cosmetics.equippedIn('stampCardTheme');
    const cfg = COSMETICS.find((c) => c.id === id);
    if (cfg?.stampCardThemeKey) {
      wrap.dataset.stampCardTheme = cfg.stampCardThemeKey;
    } else {
      delete wrap.dataset.stampCardTheme;
    }
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.overlay?.remove();
    this.overlay = null;
    this.dismissCleanedPopup();
    this.onClose();
  }

  refreshIfOpen(): void {
    if (this.isOpen && !this.cleaningInProgress) this.render();
  }

  private render(): void {
    if (!this.overlay) return;
    const body = this.overlay.querySelector('#stamp-body') as HTMLElement;
    body.innerHTML = '';

    this.overlay.querySelectorAll<HTMLElement>('.tab-btn').forEach((btn) => {
      const active = btn.dataset.tab === this.tab;
      btn.style.background = active ? 'var(--color-accent-pink)' : 'rgba(255,255,255,0.6)';
      btn.style.color = active ? 'white' : 'var(--color-ink)';
      btn.style.borderColor = active ? 'var(--color-accent-pink)' : 'var(--color-paper-edge)';
    });

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;font-size:13px;color:var(--color-ink-soft);margin-bottom:6px;';
    const owned = this.store.save.data.badgesUnlocked.length;
    header.innerHTML = `<span>Sticker Shine: <strong style="color:var(--color-accent-pink)">${this.store.save.data.stickerShine}</strong></span>
      <span>${owned}/${BADGES.length} badges</span>`;
    body.appendChild(header);

    if (this.tab === 'badges') this.renderBadges(body);
    else if (this.tab === 'cosmetics') this.renderCosmetics(body);
    else this.renderBoosts(body);
  }

  private renderBadges(body: HTMLElement): void {
    const groups = badgesByCategory();
    const order = ['Popping', 'Survival', 'Upgrade', 'Skill', 'Prestige'];
    for (const cat of order) {
      const list = groups[cat] ?? [];
      if (list.length === 0) continue;
      const title = document.createElement('div');
      title.className = 'cosmetic-section-title';
      title.textContent = cat;
      body.appendChild(title);
      const grid = document.createElement('div');
      grid.className = 'stamp-grid';
      for (const b of list) {
        const unlocked = this.store.save.data.badgesUnlocked.includes(b.id);
        const cleaned = this.store.save.data.badgesCleaned.includes(b.id);

        const cell = document.createElement('div');
        const stickerClass = this.hasStickerArt(b) ? ' stamp-cell--sticker' : '';
        if (!unlocked) {
          cell.className = 'stamp-cell locked';
        } else if (cleaned) {
          cell.className = `stamp-cell cleaned${stickerClass}`;
        } else {
          cell.className = `stamp-cell dirty${stickerClass}`;
        }

        if (!unlocked) {
          // Locked state
          cell.innerHTML = `
            <div class="badge-image-wrap">
              <div class="lock-icon">&#x1f512;</div>
            </div>
            <div class="title">???</div>
            <div class="progress">${b.description}</div>
            <div class="reward-hint">Reward: ??? Sticker Shine</div>`;
        } else if (cleaned) {
          // Clean state
          cell.innerHTML = `
            <div class="badge-image-wrap">
              ${this.badgeArtMarkup(b)}
              ${this.cleanedFxMarkup(b)}
            </div>
            <div class="title">${b.name}</div>
            <div class="progress cleaned-label">Cleaned! +${b.rewardStickerShine}&#9733;</div>`;
        } else {
          // Dirty state -- ensure cleaning state exists (handles pre-v2 unlocked badges)
          if (!this.store.save.data.badgeCleaningState[b.id]) {
            this.badges.ensureCleaningState(b.id);
          }
          const state = this.store.save.data.badgeCleaningState[b.id];
          const progress = state?.cleaningProgress ?? 0;
          const required = state?.cleaningRequired ?? 10;
          const mudOpacity = 1 - progress / required;

          if (b.dirtyImage) {
            cell.innerHTML = `
              ${this.dirtyBadgeArtMarkup(b, progress, required)}
              <div class="title">${b.name}</div>
              <div class="clean-prompt">Tap to Clean!</div>`;
          } else {
            cell.innerHTML = `
              <div class="badge-image-wrap">
                ${this.badgeArtMarkup(b)}
                <div class="mud-overlay" style="opacity:${mudOpacity.toFixed(2)}"></div>
              </div>
              <div class="title">${b.name}</div>
              <div class="clean-prompt">Tap to Clean!</div>`;
          }

          this.bindCleaningInteraction(cell, b.id);
        }

        grid.appendChild(cell);
      }
      body.appendChild(grid);
    }
  }

  private hasStickerArt(b: BadgeConfig): boolean {
    return b.image !== BADGE_PLACEHOLDER;
  }

  private badgeArtMarkup(b: BadgeConfig): string {
    if (this.hasStickerArt(b)) {
      return `<img class="badge-sticker" src="${b.image}" alt="" draggable="false">`;
    }
    return `<div class="icon">${b.icon}</div>`;
  }

  private dirtyBadgeArtMarkup(b: BadgeConfig, progress: number, required: number): string {
    const cleanOpacity = (progress / required).toFixed(2);
    const dirtyOpacity = (1 - progress / required).toFixed(2);
    return `
      <div class="badge-image-wrap badge-image-wrap--blend">
        <img class="badge-sticker badge-sticker--clean" src="${b.image}" alt="" draggable="false" style="opacity:${cleanOpacity}">
        <img class="badge-sticker badge-sticker--dirty" src="${b.dirtyImage}" alt="" draggable="false" style="opacity:${dirtyOpacity}">
      </div>`;
  }

  private updateCleaningVisuals(
    cell: HTMLElement,
    progress: number,
    required: number,
  ): void {
    const cleanEl = cell.querySelector('.badge-sticker--clean') as HTMLElement | null;
    const dirtyEl = cell.querySelector('.badge-sticker--dirty') as HTMLElement | null;
    if (cleanEl && dirtyEl) {
      const t = progress / required;
      cleanEl.style.opacity = Math.min(1, t).toFixed(2);
      dirtyEl.style.opacity = Math.max(0, 1 - t).toFixed(2);
      return;
    }

    const mudEl = cell.querySelector('.mud-overlay') as HTMLElement | null;
    if (mudEl) {
      mudEl.style.opacity = Math.max(0, 1 - progress / required).toFixed(2);
    }
  }

  private cleanedFxMarkup(b: BadgeConfig): string {
    if (this.hasStickerArt(b)) {
      return `
        <div class="badge-holo"></div>
        <div class="badge-sparkles" aria-hidden="true">
          <span class="sparkle"></span>
          <span class="sparkle"></span>
          <span class="sparkle"></span>
          <span class="sparkle"></span>
          <span class="sparkle"></span>
        </div>`;
    }
    return `<div class="shine-idle"></div>`;
  }

  private bindCleaningInteraction(cell: HTMLElement, badgeId: string): void {
    cell.style.cursor = 'pointer';
    let scrubbing = false;

    const doClean = () => {
      this.cleaningInProgress = true;
      const result = this.badges.clean(badgeId);
      if (!result) {
        this.cleaningInProgress = false;
        return;
      }

      this.sound.play('squeakyClean');

      // Wiggle animation
      cell.classList.remove('badge-wiggle');
      void cell.offsetWidth;
      cell.classList.add('badge-wiggle');

      // Update mud overlay or sticker crossfade
      this.updateCleaningVisuals(cell, result.progress, result.required);

      if (result.justCompleted) {
        this.sound.play('bling');
        cell.classList.add('badge-complete');

        const cfg = BADGES.find((b) => b.id === badgeId);
        if (cfg) this.showCleanedPopup(cfg.name, cfg.rewardStickerShine);

        setTimeout(() => {
          this.cleaningInProgress = false;
          this.render();
        }, 1200);
      } else {
        this.cleaningInProgress = false;
      }
    };

    // Tap to clean (works on both desktop and mobile)
    cell.addEventListener('click', (e) => {
      e.stopPropagation();
      doClean();
    });

    // Mobile scrub: track pointer down/up to know when finger is on the cell
    cell.addEventListener('pointerdown', () => {
      scrubbing = true;
    });
    cell.addEventListener('pointerup', () => { scrubbing = false; });
    cell.addEventListener('pointercancel', () => { scrubbing = false; });
    cell.addEventListener('pointerleave', () => { scrubbing = false; });

    cell.addEventListener('pointermove', () => {
      if (!scrubbing) return;
      const now = performance.now();
      if (now - this.lastScrubTime < SCRUB_COOLDOWN_MS) return;
      this.lastScrubTime = now;
      doClean();
    });
  }

  private showCleanedPopup(name: string, shine: number): void {
    this.dismissCleanedPopup();
    const popup = document.createElement('div');
    popup.className = 'badge-cleaned-popup';
    popup.innerHTML = `
      <div class="popup-title">Badge Cleaned!</div>
      <div class="popup-badge-name">${name}</div>
      <div class="popup-reward">+${shine} Sticker Shine &#9733;</div>`;
    this.overlay?.querySelector('.panel-card')?.appendChild(popup);
    this.cleanedPopup = popup;

    requestAnimationFrame(() => popup.classList.add('visible'));

    this.cleanedPopupTimer = setTimeout(() => this.dismissCleanedPopup(), 2800);
  }

  private dismissCleanedPopup(): void {
    if (this.cleanedPopupTimer) clearTimeout(this.cleanedPopupTimer);
    this.cleanedPopupTimer = null;
    this.cleanedPopup?.remove();
    this.cleanedPopup = null;
  }

  private renderCosmetics(body: HTMLElement): void {
    const sections: { cat: CosmeticCategory; label: string }[] = [
      { cat: 'uiTheme', label: 'UI Themes' },
      { cat: 'backgroundTheme', label: 'Backgrounds' },
      { cat: 'balloonSkin', label: 'Balloon Skins' },
      { cat: 'popEffect', label: 'Pop Effects' },
      { cat: 'stampCardTheme', label: 'Goody Bag Themes' },
    ];
    for (const sec of sections) {
      const list = COSMETICS.filter((c) => c.category === sec.cat);
      const title = document.createElement('div');
      title.className = 'cosmetic-section-title';
      title.textContent = sec.label;
      body.appendChild(title);
      const grid = document.createElement('div');
      grid.className = 'cosmetic-grid';
      for (const c of list) {
        const owned = this.cosmetics.isOwned(c.id);
        const equipped = this.cosmetics.equippedIn(c.category) === c.id;
        const cell = document.createElement('div');
        cell.className = `cosmetic-cell${equipped ? ' equipped' : ''}${owned ? '' : ' locked'}`;
        cell.innerHTML = `
          <div class="swatch" style="background:${c.swatch}"></div>
          <div class="name">${c.name}</div>
          <div class="cost">${owned ? '' : `Cost: ${c.cost}`}</div>`;
        const btn = document.createElement('button');
        if (!owned) {
          btn.className = 'buy-btn';
          btn.textContent = 'Buy';
          btn.disabled = this.store.save.data.stickerShine < c.cost;
          btn.addEventListener('click', () => {
            if (this.cosmetics.buy(c.id)) this.render();
          });
        } else {
          btn.className = `equip-btn${equipped ? ' equipped' : ''}`;
          btn.textContent = equipped ? 'Equipped' : 'Equip';
          btn.disabled = equipped;
          btn.addEventListener('click', () => {
            if (this.cosmetics.equip(c.id)) this.render();
          });
        }
        cell.appendChild(btn);
        grid.appendChild(cell);
      }
      body.appendChild(grid);
    }
  }

  private renderBoosts(body: HTMLElement): void {
    const title = document.createElement('div');
    title.className = 'cosmetic-section-title';
    title.textContent = 'Permanent Boosts';
    body.appendChild(title);
    const intro = document.createElement('div');
    intro.style.cssText = 'font-size:12px;color:var(--color-ink-soft);margin-bottom:8px;';
    intro.textContent = 'Spend Sticker Shine on tiny permanent edges. Effects stack.';
    body.appendChild(intro);
    for (const b of this.boosts.list()) {
      const owned = this.boosts.isOwned(b.id);
      const card = document.createElement('div');
      card.className = 'shop-item';
      card.innerHTML = `
        <div class="icon">+</div>
        <div class="info">
          <div class="title">${b.name}</div>
          <div class="desc">${b.description}</div>
        </div>
        <button class="buy-button">${owned ? 'Owned' : `*${b.cost}`}</button>`;
      const btn = card.querySelector('.buy-button') as HTMLButtonElement;
      btn.disabled = owned || this.store.save.data.stickerShine < b.cost;
      if (owned) btn.classList.add('maxed');
      btn.addEventListener('click', () => {
        if (this.boosts.buy(b.id)) this.render();
      });
      body.appendChild(card);
    }
  }
}
