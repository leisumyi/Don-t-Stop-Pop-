import type { GameStore } from '../core/GameStore';
import type { PrestigeSystem } from '../systems/PrestigeSystem';
import { BADGES, BADGE_PLACEHOLDER } from '../data/badges';
import homeButtonUrl from '../../images/Homebutton.png';
import bgmButtonUrl from '../../images/BGMbutton.png';
import bgmButtonMuteUrl from '../../images/BGMbuttonmute.png';
import volumeButtonUrl from '../../images/Volumebutton.png';
import volumeButtonMuteUrl from '../../images/Volumebuttonmute.png';
import partyBucksUrl from '../../images/partybucks.png';
import stickerShineUrl from '../../images/stickershine.png';
import shopButtonUrl from '../../images/I_shop.png';
import goodyBagButtonUrl from '../../images/I_goodybag.png';
import newPartyButtonUrl from '../../images/I_newparty.png';

const VERSION_LABEL = 'v0.1.0';

export interface HUDCallbacks {
  onShop: () => void;
  onStampCard: () => void;
  onPrestige: () => void;
  onToggleBgm: (muted: boolean) => void;
  onToggleSfx: (muted: boolean) => void;
  onHome: () => void;
}

/**
 * Persistent on-screen HUD with currency pills, escape meter, combo readout,
 * floating reward text, hazard banner, screen pulse, and bottom navigation.
 */
export class HUD {
  private root: HTMLElement;
  private partyBucksEl!: HTMLElement;
  private bucksValueEl!: HTMLElement;
  private bucksDeltaEl!: HTMLElement;
  private homeButton!: HTMLButtonElement;
  private stickerShineEl!: HTMLElement;
  private shineValueEl!: HTMLElement;
  private meterFill!: HTMLElement;
  private meterContainer!: HTMLElement;
  private popsCountEl!: HTMLElement;
  private comboReadout!: HTMLElement;
  private hazardBanner!: HTMLElement;
  private screenPulse!: HTMLElement;
  private badgeToast!: HTMLElement;
  private badgeToastIcon!: HTMLElement;
  private badgeToastTitle!: HTMLElement;
  private badgeToastBody!: HTMLElement;
  private versionLabel!: HTMLElement;
  private bottomBar!: HTMLElement;
  private btnShop!: HTMLButtonElement;
  private btnStamp!: HTMLButtonElement;
  private btnPrestige!: HTMLButtonElement;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private hazardTimer: ReturnType<typeof setTimeout> | null = null;
  private comboTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private store: GameStore,
    private prestige: PrestigeSystem,
    private callbacks: HUDCallbacks,
  ) {
    const root = document.getElementById('ui-root');
    if (!root) throw new Error('#ui-root not found');
    this.root = root;
    this.build();
    this.subscribe();
    this.refreshAll();
  }

  private build(): void {
    // Top bar
    const top = document.createElement('div');
    top.className = 'hud-top';

    const bucksStack = document.createElement('div');
    bucksStack.className = 'party-bucks-stack';

    this.partyBucksEl = document.createElement('div');
    this.partyBucksEl.className = 'hud-pill party-bucks';
    this.partyBucksEl.innerHTML =
      `<img class="party-bucks-icon" src="${partyBucksUrl}" alt="" draggable="false"><span class="bucks-value">0</span><span class="delta"></span>`;
    this.bucksValueEl = this.partyBucksEl.querySelector('.bucks-value')!;
    this.bucksDeltaEl = this.partyBucksEl.querySelector('.delta')!;
    bucksStack.appendChild(this.partyBucksEl);

    this.homeButton = document.createElement('button');
    this.homeButton.type = 'button';
    this.homeButton.className = 'home-button';
    this.homeButton.setAttribute('aria-label', 'Back to home');
    this.homeButton.title = 'Back to home';
    const homeIcon = document.createElement('img');
    homeIcon.className = 'home-button-icon';
    homeIcon.src = homeButtonUrl;
    homeIcon.alt = '';
    homeIcon.draggable = false;
    this.homeButton.appendChild(homeIcon);
    this.homeButton.addEventListener('click', () => this.callbacks.onHome());
    bucksStack.appendChild(this.homeButton);

    top.appendChild(bucksStack);

    this.meterContainer = document.createElement('div');
    this.meterContainer.className = 'hud-meter';
    this.meterContainer.innerHTML =
      '<div class="hud-meter-label">Don\'t Let the Balloons Escape!</div><div class="hud-meter-track"><div class="hud-meter-fill"></div></div><div class="hud-pop-count">Balloons popped: <span class="hud-pop-count-value">0</span></div>';
    this.meterFill = this.meterContainer.querySelector('.hud-meter-fill')!;
    this.popsCountEl = this.meterContainer.querySelector('.hud-pop-count-value')!;
    top.appendChild(this.meterContainer);

    this.stickerShineEl = document.createElement('div');
    this.stickerShineEl.className = 'hud-pill sticker-shine';
    this.stickerShineEl.innerHTML =
      `<img class="sticker-shine-icon" src="${stickerShineUrl}" alt="" draggable="false"><span class="shine-value">0</span>`;
    this.shineValueEl = this.stickerShineEl.querySelector('.shine-value')!;
    top.appendChild(this.stickerShineEl);

    this.root.appendChild(top);

    this.buildAudioButtons();

    // Combo
    this.comboReadout = document.createElement('div');
    this.comboReadout.className = 'combo-readout';
    this.root.appendChild(this.comboReadout);

    // Hazard banner
    this.hazardBanner = document.createElement('div');
    this.hazardBanner.className = 'hazard-banner';
    this.root.appendChild(this.hazardBanner);

    // Screen pulse layer
    this.screenPulse = document.createElement('div');
    this.screenPulse.className = 'screen-pulse';
    this.root.appendChild(this.screenPulse);

    // Badge toast
    this.badgeToast = document.createElement('div');
    this.badgeToast.className = 'badge-toast';
    this.badgeToast.innerHTML =
      '<span class="toast-icon">*</span><div><span class="toast-title">Badge Unlocked</span><div class="toast-body"></div></div>';
    this.badgeToastIcon = this.badgeToast.querySelector('.toast-icon')!;
    this.badgeToastTitle = this.badgeToast.querySelector('.toast-title')!;
    this.badgeToastBody = this.badgeToast.querySelector('.toast-body')!;
    this.root.appendChild(this.badgeToast);

    // Bottom nav
    this.bottomBar = document.createElement('div');
    this.bottomBar.className = 'hud-bottom';
    this.btnShop = document.createElement('button');
    this.btnShop.type = 'button';
    this.btnShop.className = 'nav-button nav-button-shop';
    this.btnShop.setAttribute('aria-label', 'Shop');
    const shopIcon = document.createElement('img');
    shopIcon.className = 'nav-shop-icon';
    shopIcon.src = shopButtonUrl;
    shopIcon.alt = '';
    shopIcon.draggable = false;
    this.btnShop.appendChild(shopIcon);
    this.btnStamp = document.createElement('button');
    this.btnStamp.type = 'button';
    this.btnStamp.className = 'nav-button nav-button-goodybag';
    this.btnStamp.setAttribute('aria-label', 'Goody Bag');
    const goodyBagIcon = document.createElement('img');
    goodyBagIcon.className = 'nav-goodybag-icon';
    goodyBagIcon.src = goodyBagButtonUrl;
    goodyBagIcon.alt = '';
    goodyBagIcon.draggable = false;
    this.btnStamp.appendChild(goodyBagIcon);
    this.btnPrestige = document.createElement('button');
    this.btnPrestige.type = 'button';
    this.btnPrestige.className = 'nav-button nav-button-newparty';
    this.btnPrestige.setAttribute('aria-label', 'New Party!');
    const newPartyIcon = document.createElement('img');
    newPartyIcon.className = 'nav-newparty-icon';
    newPartyIcon.src = newPartyButtonUrl;
    newPartyIcon.alt = '';
    newPartyIcon.draggable = false;
    this.btnPrestige.appendChild(newPartyIcon);
    this.btnShop.addEventListener('click', () => this.callbacks.onShop());
    this.btnStamp.addEventListener('click', () => this.callbacks.onStampCard());
    this.btnPrestige.addEventListener('click', () => this.callbacks.onPrestige());
    this.bottomBar.appendChild(this.btnShop);
    this.bottomBar.appendChild(this.btnStamp);
    this.bottomBar.appendChild(this.btnPrestige);
    this.root.appendChild(this.bottomBar);

    // Version label sits on the phone frame, not the UI root.
    this.versionLabel = document.createElement('div');
    this.versionLabel.className = 'version-label';
    this.versionLabel.textContent = `Don't Stop Pop! ${VERSION_LABEL}`;
    this.versionLabel.title = "Don't Stop Pop! - made with Three.js + Vite";
    document.getElementById('phone-frame')?.appendChild(this.versionLabel);
  }

  private buildAudioButtons(): void {
    const wrap = document.createElement('div');
    wrap.className = 'audio-controls';

    const bgmBtn = document.createElement('button');
    bgmBtn.type = 'button';
    bgmBtn.className = 'audio-icon-button';
    const sfxBtn = document.createElement('button');
    sfxBtn.type = 'button';
    sfxBtn.className = 'audio-icon-button';

    const oldMasterMuted = localStorage.getItem('dontStopPop:muted') === '1';
    let bgmMuted = localStorage.getItem('dontStopPop:bgmMuted') === '1';
    let sfxMuted = localStorage.getItem('dontStopPop:sfxMuted') === '1';
    // Backward-compat migration path from the old single mute toggle.
    if (!localStorage.getItem('dontStopPop:bgmMuted') && oldMasterMuted) bgmMuted = true;
    if (!localStorage.getItem('dontStopPop:sfxMuted') && oldMasterMuted) sfxMuted = true;

    const paint = () => {
      bgmBtn.innerHTML = `<img class="audio-icon-image" src="${bgmMuted ? bgmButtonMuteUrl : bgmButtonUrl}" alt="" draggable="false">`;
      sfxBtn.innerHTML = `<img class="audio-icon-image" src="${sfxMuted ? volumeButtonMuteUrl : volumeButtonUrl}" alt="" draggable="false">`;

      bgmBtn.setAttribute('aria-pressed', String(bgmMuted));
      sfxBtn.setAttribute('aria-pressed', String(sfxMuted));
      bgmBtn.setAttribute('aria-label', bgmMuted ? 'Unmute music' : 'Mute music');
      sfxBtn.setAttribute('aria-label', sfxMuted ? 'Unmute sound effects' : 'Mute sound effects');
      bgmBtn.title = bgmMuted ? 'Music: Off' : 'Music: On';
      sfxBtn.title = sfxMuted ? 'SFX: Off' : 'SFX: On';
    };

    paint();

    bgmBtn.addEventListener('click', () => {
      bgmMuted = !bgmMuted;
      localStorage.setItem('dontStopPop:bgmMuted', bgmMuted ? '1' : '0');
      paint();
      this.callbacks.onToggleBgm(bgmMuted);
    });
    sfxBtn.addEventListener('click', () => {
      sfxMuted = !sfxMuted;
      localStorage.setItem('dontStopPop:sfxMuted', sfxMuted ? '1' : '0');
      paint();
      this.callbacks.onToggleSfx(sfxMuted);
    });

    wrap.appendChild(bgmBtn);
    wrap.appendChild(sfxBtn);
    this.root.appendChild(wrap);

    // Apply initial states once consumers are wired.
    if (bgmMuted) this.callbacks.onToggleBgm(true);
    if (sfxMuted) this.callbacks.onToggleSfx(true);
  }

  private subscribe(): void {
    this.store.bus.on('partyBucks:change', ({ value, delta }) => {
      this.bucksValueEl.textContent = formatNumber(value);
      this.partyBucksEl.classList.add('bump');
      setTimeout(() => this.partyBucksEl.classList.remove('bump'), 180);
      if (delta > 0) {
        this.bucksDeltaEl.textContent = `+${formatNumber(delta)}`;
        clearTimeout((this as any).deltaTimer);
        (this as any).deltaTimer = setTimeout(() => {
          this.bucksDeltaEl.textContent = '';
        }, 600);
      } else {
        this.bucksDeltaEl.textContent = '';
      }
      this.refreshPrestigeButton();
    });

    this.store.bus.on('escape:change', ({ value, max }) => {
      const pct = Math.min(100, Math.max(0, (value / max) * 100));
      this.meterFill.style.width = `${pct}%`;
      if (pct >= 75) this.meterContainer.classList.add('danger');
      else this.meterContainer.classList.remove('danger');
      // pulse the screen briefly when meter is in late-danger range
      if (pct >= 90) this.flash(0.4);
    });

    this.store.bus.on('combo:change', ({ combo, multiplier }) => {
      if (combo >= 5) {
        this.comboReadout.textContent = `Combo x${combo}  +${Math.round((multiplier - 1) * 100)}%`;
        this.comboReadout.classList.add('visible');
        clearTimeout(this.comboTimer ?? undefined);
        this.comboTimer = setTimeout(() => this.comboReadout.classList.remove('visible'), 1400);
      } else if (combo === 0) {
        this.comboReadout.classList.remove('visible');
      }
    });

    this.store.bus.on('stickerShine:change', ({ value }) => {
      this.shineValueEl.textContent = formatNumber(value);
      this.stickerShineEl.classList.add('bump');
      setTimeout(() => this.stickerShineEl.classList.remove('bump'), 180);
    });

    this.store.bus.on('hazard:start', ({ id }) => {
      this.showHazard(this.hazardLabel(id));
    });
    this.store.bus.on('hazard:end', () => {
      this.clearHazardSoon();
    });

    this.store.bus.on('badge:unlock', ({ id }) => {
      this.showBadgeToast(id);
    });

    this.store.bus.on('floatingText:spawn', ({ x, y, text, golden }) => {
      this.spawnRewardText(x, y, text, golden);
    });

    this.store.bus.on('pop:registered', () => {
      this.popsCountEl.textContent = formatNumber(this.store.run.stats.popsTotal);
    });

    this.store.bus.on('screen:flash', ({ intensity }) => {
      this.flash(intensity);
    });

    this.store.bus.on('run:reset', () => this.refreshAll());
  }

  private hazardLabel(id: string): string {
    switch (id) {
      case 'windstorm':
        return 'Windstorm!';
      case 'cloudCover':
        return 'Cloud Cover!';
      case 'birthdayRush':
        return 'Birthday Rush!';
      default:
        return id;
    }
  }

  private showHazard(text: string): void {
    this.hazardBanner.textContent = text;
    this.hazardBanner.classList.add('visible');
    clearTimeout(this.hazardTimer ?? undefined);
    this.hazardTimer = setTimeout(() => {
      this.hazardBanner.classList.remove('visible');
    }, 2200);
  }

  private clearHazardSoon(): void {
    clearTimeout(this.hazardTimer ?? undefined);
    this.hazardTimer = setTimeout(() => {
      this.hazardBanner.classList.remove('visible');
    }, 200);
  }

  private showBadgeToast(id: string): void {
    const cfg = BADGES.find((b) => b.id === id);
    if (!cfg) return;

    if (cfg.image !== BADGE_PLACEHOLDER) {
      const src = cfg.dirtyImage ?? cfg.image;
      this.badgeToastIcon.innerHTML =
        `<img src="${src}" alt="" draggable="false">`;
    } else {
      this.badgeToastIcon.textContent = cfg.icon;
    }

    this.badgeToastTitle.textContent = cfg.name;
    this.badgeToastBody.textContent = 'New dirty badge! Clean it in your Goody Bag.';
    this.badgeToast.classList.add('visible');
    clearTimeout(this.toastTimer ?? undefined);
    this.toastTimer = setTimeout(() => {
      this.badgeToast.classList.remove('visible');
    }, 2800);
  }

  private spawnRewardText(clientX: number, clientY: number, text: string, golden = false): void {
    const phone = document.getElementById('phone-frame');
    if (!phone) return;
    const rect = phone.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const el = document.createElement('div');
    el.className = `reward-text${golden ? ' golden' : ''}`;
    el.style.left = `${localX}px`;
    el.style.top = `${localY}px`;
    el.textContent = text;
    phone.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  private flash(intensity: number): void {
    this.screenPulse.style.background = `rgba(255, 111, 122, ${0.18 * Math.min(1.5, intensity)})`;
    this.screenPulse.classList.remove('flash');
    void this.screenPulse.offsetWidth;
    this.screenPulse.classList.add('flash');
  }

  private refreshAll(): void {
    const run = this.store.run;
    const save = this.store.save.data;
    this.bucksValueEl.textContent = formatNumber(run.partyBucks);
    this.shineValueEl.textContent = formatNumber(save.stickerShine);
    const pct = (run.escapeMeter / run.escapeMeterMax) * 100;
    this.meterFill.style.width = `${pct}%`;
    this.popsCountEl.textContent = formatNumber(run.stats.popsTotal);
    this.refreshPrestigeButton();
  }

  refreshPrestigeButton(): void {
    if (this.prestige.isUnlocked()) {
      const gainPct = Math.round(this.prestige.pendingGain() * 100);
      this.btnPrestige.classList.remove('locked');
      this.btnPrestige.setAttribute('aria-label', `New Party! (+${gainPct}% Mult)`);
      this.btnPrestige.title = `New Party! (+${gainPct}% Mult)`;
    } else {
      this.btnPrestige.classList.add('locked');
      this.btnPrestige.setAttribute('aria-label', `New Party! (${this.prestige.unlockThreshold / 1000}k party bucks needed)`);
      this.btnPrestige.title = `New Party! (${this.prestige.unlockThreshold / 1000}k party bucks needed)`;
    }
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return Math.floor(n).toLocaleString();
}
