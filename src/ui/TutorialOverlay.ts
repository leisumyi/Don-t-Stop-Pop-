import type { GameStore } from '../core/GameStore';

export type TutorialPhase = 'inactive' | 'intro' | 'single-balloon' | 'three-balloons' | 'escape-warning';

export class TutorialOverlay {
  private overlay: HTMLElement | null = null;
  private bubble: HTMLElement | null = null;
  private ring: HTMLElement | null = null;
  private phase: TutorialPhase = 'inactive';
  private active = false;
  private resolveDone?: () => void;
  private offTap?: () => void;

  constructor(private store: GameStore) {}

  shouldRun(): boolean {
    return !this.store.save.data.tutorialCompleted;
  }

  start(): Promise<void> {
    if (this.active) return Promise.resolve();
    this.active = true;
    this.setPhase('intro');
    return new Promise<void>((resolve) => {
      this.resolveDone = resolve;
    });
  }

  isActive(): boolean {
    return this.active;
  }

  getPhase(): TutorialPhase {
    return this.phase;
  }

  advanceFromSingleBalloonPop(): void {
    if (!this.active || this.phase !== 'single-balloon') return;
    this.hideRing();
    this.setPhase('three-balloons');
  }

  showEscapeWarning(): void {
    if (!this.active || this.phase !== 'three-balloons') return;
    this.setPhase('escape-warning');
  }

  showRing(clientX: number, clientY: number, diameter = 112): void {
    if (!this.active || this.phase !== 'single-balloon') return;
    this.ensureDom();
    if (!this.ring) return;
    this.ring.style.display = 'block';
    this.ring.style.left = `${clientX}px`;
    this.ring.style.top = `${clientY}px`;
    this.ring.style.width = `${diameter}px`;
    this.ring.style.height = `${diameter}px`;
  }

  hideRing(): void {
    if (!this.ring) return;
    this.ring.style.display = 'none';
  }

  private ensureDom(): void {
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'tutorial-overlay';
      this.bubble = document.createElement('div');
      this.bubble.className = 'tutorial-bubble';
      this.ring = document.createElement('div');
      this.ring.className = 'tutorial-ring';
      this.overlay.appendChild(this.bubble);
      this.overlay.appendChild(this.ring);
      document.getElementById('ui-root')!.appendChild(this.overlay);
    }
  }

  private setPhase(next: TutorialPhase): void {
    this.phase = next;
    this.ensureDom();
    if (!this.overlay || !this.bubble) return;

    this.offTap?.();
    this.offTap = undefined;
    this.overlay.classList.remove('is-tappable');
    this.bubble.classList.remove('is-tappable');
    this.bubble.classList.remove('is-hidden');
    this.bubble.innerHTML = '';

    if (next === 'intro') {
      this.overlay.classList.add('is-tappable');
      this.bubble.classList.add('is-tappable');
      this.bubble.innerHTML = `
        <div class="tutorial-title">Tap balloons before they float away!</div>
        <div class="tutorial-hint">Tap this message to continue</div>
      `;
      const onTap = (event: Event): void => {
        event.preventDefault();
        this.setPhase('single-balloon');
      };
      this.bubble.addEventListener('pointerdown', onTap, { once: true });
      this.offTap = () => this.bubble?.removeEventListener('pointerdown', onTap);
      this.hideRing();
      return;
    }

    if (next === 'single-balloon' || next === 'three-balloons') {
      this.hideBubble();
      return;
    }

    if (next === 'escape-warning') {
      this.overlay.classList.add('is-tappable');
      this.bubble.classList.add('is-tappable');
      this.bubble.innerHTML = `
        <div class="tutorial-title">Don't let the balloons escape!</div>
        <div class="tutorial-hint">Tap anywhere to start the game</div>
      `;
      const onTap = (event: Event): void => {
        event.preventDefault();
        this.complete();
      };
      this.overlay.addEventListener('pointerdown', onTap, { once: true });
      this.offTap = () => this.overlay?.removeEventListener('pointerdown', onTap);
      this.hideRing();
      return;
    }

    this.hideBubble();
  }

  private hideBubble(): void {
    if (!this.bubble) return;
    this.bubble.innerHTML = '';
    this.bubble.classList.add('is-hidden');
  }

  complete(): void {
    if (!this.active) return;
    this.active = false;
    this.phase = 'inactive';
    this.offTap?.();
    this.offTap = undefined;
    this.hideRing();
    this.overlay?.remove();
    this.overlay = null;
    this.bubble = null;
    this.ring = null;
    this.store.updateSave((s) => {
      s.tutorialCompleted = true;
    });
    this.resolveDone?.();
    this.resolveDone = undefined;
  }

  /** Force-skip the tutorial (e.g. via dev tools / reset). */
  skip(): void {
    if (!this.active) return;
    this.complete();
  }
}
