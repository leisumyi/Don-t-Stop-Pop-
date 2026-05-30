import type { GameStore } from '../core/GameStore';
import type { ShopSystem } from '../systems/ShopSystem';
import { SHOP_ITEMS } from '../data/upgrades';
import type { ShopItemId } from '../core/types';

export class ShopPanel {
  private overlay: HTMLElement | null = null;
  private isOpen = false;

  constructor(
    private store: GameStore,
    private shop: ShopSystem,
    private onClose: () => void,
  ) {
    this.store.bus.on('partyBucks:change', () => {
      if (this.isOpen) this.render();
    });
    this.store.bus.on('shop:purchase', () => {
      if (this.isOpen) this.render();
    });
  }

  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.overlay = document.createElement('div');
    this.overlay.className = 'panel-overlay';
    this.overlay.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <h2>Party Shop</h2>
          <button class="panel-close" aria-label="Close">x</button>
        </div>
        <div class="panel-body" id="shop-body"></div>
      </div>`;
    this.overlay.querySelector('.panel-close')!.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
    document.getElementById('ui-root')!.appendChild(this.overlay);
    this.render();
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.overlay?.remove();
    this.overlay = null;
    this.onClose();
  }

  private render(): void {
    if (!this.overlay) return;
    const body = this.overlay.querySelector('#shop-body')!;
    body.innerHTML = '';
    for (const cfg of SHOP_ITEMS) {
      const id = cfg.id as ShopItemId;
      const level = this.shop.getLevel(id);
      const cost = this.shop.cost(id);
      const maxed = this.shop.isMaxed(id);
      const free = (this.store.run.freeInstantsRemaining[id] ?? 0) > 0;
      const canBuy = !maxed && (free || this.store.run.partyBucks >= cost);

      const item = document.createElement('div');
      item.className = 'shop-item';
      const levelLabel =
        cfg.kind === 'idle'
          ? `Level ${level}/${cfg.maxLevel}`
          : free
            ? `${this.store.run.freeInstantsRemaining[id]} free!`
            : 'Tap to use';

      item.innerHTML = `
        <div class="icon">${cfg.icon}</div>
        <div class="info">
          <div class="title">${cfg.name}</div>
          <div class="desc">${cfg.description}</div>
          <div class="level">${levelLabel}</div>
        </div>
        <button class="buy-button${maxed ? ' maxed' : ''}" ${canBuy ? '' : 'disabled'}>
          ${maxed ? 'MAX' : free ? 'FREE' : `${formatCost(cost)}`}
        </button>`;
      const btn = item.querySelector('.buy-button') as HTMLButtonElement;
      btn.addEventListener('click', () => {
        const ok = this.shop.buy(id);
        if (!ok) return;
        this.render();
      });
      body.appendChild(item);
    }
  }
}

function formatCost(n: number): string {
  if (n >= 10000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
}
