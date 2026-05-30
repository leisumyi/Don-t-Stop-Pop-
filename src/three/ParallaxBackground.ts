import * as THREE from 'three';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from './constants';
import { loadCloudTextures, randomCloudTexture } from './cloudTextures';

/**
 * Soft 2.5D layered birthday-sky background.
 *
 * Layers (back to front):
 *   1. Sky gradient plane (full-screen)
 *   2. Distant soft clouds (slow drift)
 *   3. Mid-layer floating clouds (faster drift, parallax)
 *
 * Uses canvas-textured planes so V1 ships zero external assets.
 */
export class ParallaxBackground {
  readonly group = new THREE.Group();
  private skyMesh: THREE.Mesh;
  private skyMaterial: THREE.MeshBasicMaterial;
  private skyCanvas: HTMLCanvasElement;
  private distantClouds: { mesh: THREE.Mesh; speed: number }[] = [];
  private midClouds: { mesh: THREE.Mesh; speed: number }[] = [];

  // overrideable cosmetic colors
  private skyTop = '#cfe9ff';
  private skyMid = '#fef0d5';
  private skyBottom = '#fff4f8';

  constructor() {
    this.group.position.z = -100;

    this.skyCanvas = this.makeSkyCanvas();
    const skyTex = new THREE.CanvasTexture(this.skyCanvas);
    skyTex.colorSpace = THREE.SRGBColorSpace;
    this.skyMaterial = new THREE.MeshBasicMaterial({ map: skyTex });
    // Tall enough to cover both the gameplay frame (centered on y=0) and the
    // menu/party frame below it (centered on y=-LOGICAL_HEIGHT), so the camera
    // pan never reveals an edge of the sky plane.
    this.skyMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(LOGICAL_WIDTH, LOGICAL_HEIGHT * 2.6),
      this.skyMaterial,
    );
    this.skyMesh.position.set(0, -LOGICAL_HEIGHT / 2, -90);
    this.group.add(this.skyMesh);

    // Defer cloud spawning until the PNG textures resolve so we can size each
    // plane by its real aspect ratio. The sky renders immediately.
    void loadCloudTextures().then(() => this.spawnClouds());
  }

  setSkyColors(top: string, mid: string, bottom: string): void {
    this.skyTop = top;
    this.skyMid = mid;
    this.skyBottom = bottom;
    this.repaintSky();
  }

  private repaintSky(): void {
    const ctx = this.skyCanvas.getContext('2d');
    if (!ctx) return;
    const w = this.skyCanvas.width;
    const h = this.skyCanvas.height;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, this.skyTop);
    grad.addColorStop(0.6, this.skyMid);
    grad.addColorStop(1, this.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    if (this.skyMaterial.map) (this.skyMaterial.map as THREE.CanvasTexture).needsUpdate = true;
  }

  private makeSkyCanvas(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 512;
    const ctx = c.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, c.height);
      grad.addColorStop(0, this.skyTop);
      grad.addColorStop(0.6, this.skyMid);
      grad.addColorStop(1, this.skyBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, c.width, c.height);
    }
    return c;
  }

  private makeCloudTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      const blobs = [
        { x: 80, y: 70, r: 50 },
        { x: 130, y: 55, r: 56 },
        { x: 180, y: 70, r: 46 },
        { x: 100, y: 90, r: 42 },
        { x: 160, y: 92, r: 38 },
      ];
      for (const b of blobs) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // soft outer glow
      const glow = ctx.createRadialGradient(128, 70, 30, 128, 70, 110);
      glow.addColorStop(0, 'rgba(255,255,255,0.18)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, c.width, c.height);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private spawnClouds(): void {
    const cloudMesh = (w: number, opacity: number): THREE.Mesh => {
      const cloud = randomCloudTexture();
      const tex = cloud?.texture ?? this.makeCloudTexture();
      const aspect = cloud?.aspect ?? 2;
      const h = w / aspect;
      return new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity }),
      );
    };

    const distantCount = 4;
    for (let i = 0; i < distantCount; i++) {
      const w = 320 + Math.random() * 120;
      const mesh = cloudMesh(w, 0.55);
      mesh.position.set(
        (Math.random() - 0.5) * (LOGICAL_WIDTH + 200),
        LOGICAL_HEIGHT * 0.15 + Math.random() * LOGICAL_HEIGHT * 0.5,
        -85,
      );
      this.group.add(mesh);
      this.distantClouds.push({ mesh, speed: 4 + Math.random() * 4 });
    }

    const midCount = 3;
    for (let i = 0; i < midCount; i++) {
      const w = 220 + Math.random() * 100;
      const mesh = cloudMesh(w, 0.78);
      mesh.position.set(
        (Math.random() - 0.5) * (LOGICAL_WIDTH + 200),
        LOGICAL_HEIGHT * 0.05 + Math.random() * LOGICAL_HEIGHT * 0.4,
        -70,
      );
      this.group.add(mesh);
      this.midClouds.push({ mesh, speed: 12 + Math.random() * 10 });
    }
  }

  update(dt: number): void {
    const wrap = LOGICAL_WIDTH / 2 + 200;
    for (const cl of this.distantClouds) {
      cl.mesh.position.x += cl.speed * dt;
      if (cl.mesh.position.x > wrap) cl.mesh.position.x = -wrap;
    }
    for (const cl of this.midClouds) {
      cl.mesh.position.x += cl.speed * dt;
      if (cl.mesh.position.x > wrap) cl.mesh.position.x = -wrap;
    }
  }
}
