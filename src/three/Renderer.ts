import * as THREE from 'three';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from './constants';
import { createCamera } from './Camera';

/**
 * Wraps a WebGLRenderer with the canvas-resize logic for the portrait
 * playfield. Keeps world space fixed at LOGICAL_WIDTH x LOGICAL_HEIGHT and
 * uses devicePixelRatio for crispness.
 */
export class Renderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.OrthographicCamera;
  private resizeObs?: ResizeObserver;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = createCamera();

    this.attachResize(canvas);
    this.resize(canvas.clientWidth, canvas.clientHeight);
  }

  private attachResize(canvas: HTMLCanvasElement): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObs = new ResizeObserver(() => {
        this.resize(canvas.clientWidth, canvas.clientHeight);
      });
      this.resizeObs.observe(canvas);
    } else {
      window.addEventListener('resize', () =>
        this.resize(canvas.clientWidth, canvas.clientHeight),
      );
    }
  }

  resize(displayWidth: number, displayHeight: number): void {
    if (displayWidth <= 0 || displayHeight <= 0) return;
    this.renderer.setSize(displayWidth, displayHeight, false);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.resizeObs?.disconnect();
    this.renderer.dispose();
  }

  /**
   * Convert a clientX/clientY pointer position into world coordinates inside
   * the orthographic camera's logical space.
   */
  pointerToWorld(canvas: HTMLCanvasElement, clientX: number, clientY: number): THREE.Vector2 {
    const rect = canvas.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    // Include the camera offset so popping works when the camera is panned off
    // origin (e.g. focused on the menu party scene). No-op during gameplay.
    const wx = (nx - 0.5) * LOGICAL_WIDTH + this.camera.position.x;
    const wy = (0.5 - ny) * LOGICAL_HEIGHT + this.camera.position.y;
    return new THREE.Vector2(wx, wy);
  }

  /**
   * Convert a world position back to client-pixel coordinates relative to the
   * canvas. Useful for spawning DOM-based floating reward text.
   */
  worldToClient(canvas: HTMLCanvasElement, wx: number, wy: number): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const nx = wx / LOGICAL_WIDTH + 0.5;
    const ny = 0.5 - wy / LOGICAL_HEIGHT;
    return {
      x: rect.left + nx * rect.width,
      y: rect.top + ny * rect.height,
    };
  }
}
