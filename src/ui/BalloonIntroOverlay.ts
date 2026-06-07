/**
 * Lightweight overlay for one-time balloon-type introductions. Reuses the
 * tutorial ring + bubble CSS classes so visuals are consistent with the
 * onboarding flow.
 */
export class BalloonIntroOverlay {
  private overlay: HTMLElement | null = null;
  private ringHost: HTMLElement | null = null;
  private bubble: HTMLElement | null = null;
  private ring: HTMLElement | null = null;
  private offTap?: () => void;

  showBubble(text: string, hint: string, onDismiss: () => void): void {
    this.ensureDom();
    if (!this.overlay || !this.bubble) return;
    this.overlay.classList.add('is-tappable');
    this.bubble.classList.remove('is-hidden');
    this.bubble.innerHTML = `
      <div class="tutorial-title">${text}</div>
      <div class="tutorial-hint">${hint}</div>
    `;
    const onTap = (event: Event): void => {
      event.preventDefault();
      this.hideBubble();
      onDismiss();
    };
    this.overlay.addEventListener('pointerdown', onTap, { once: true });
    this.offTap = () => this.overlay?.removeEventListener('pointerdown', onTap);
  }

  showRing(clientX: number, clientY: number, diameter: number): void {
    this.ensureDom();
    if (!this.ring || !this.ringHost) return;
    const rect = this.ringHost.getBoundingClientRect();
    this.ring.style.display = 'block';
    this.ring.style.left = `${clientX - rect.left}px`;
    this.ring.style.top = `${clientY - rect.top}px`;
    this.ring.style.width = `${diameter}px`;
    this.ring.style.height = `${diameter}px`;
  }

  hideRing(): void {
    if (!this.ring) return;
    this.ring.style.display = 'none';
  }

  private hideBubble(): void {
    this.offTap?.();
    this.offTap = undefined;
    if (!this.bubble) return;
    this.bubble.innerHTML = '';
    this.bubble.classList.add('is-hidden');
    if (this.overlay) this.overlay.classList.remove('is-tappable');
  }

  private ensureDom(): void {
    if (!this.overlay || !this.bubble) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'tutorial-overlay';
      this.bubble = document.createElement('div');
      this.bubble.className = 'tutorial-bubble';
      this.overlay.appendChild(this.bubble);
      document.getElementById('ui-root')!.appendChild(this.overlay);
    }

    if (!this.ringHost || !this.ring) {
      this.ringHost = document.createElement('div');
      this.ringHost.className = 'tutorial-ring-host';
      this.ring = document.createElement('div');
      this.ring.className = 'tutorial-ring';
      this.ringHost.appendChild(this.ring);
      document.getElementById('ui-root')!.appendChild(this.ringHost);
    }
  }

  teardown(): void {
    this.offTap?.();
    this.offTap = undefined;
    this.hideRing();
    this.ringHost?.remove();
    this.overlay?.remove();
    this.ringHost = null;
    this.overlay = null;
    this.bubble = null;
    this.ring = null;
  }
}
