import * as THREE from 'three';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from './constants';
import houseUrl from '../../images/A_House.png';

/**
 * Starting-menu back-garden party scene, rendered from the finished A_House.png
 * artwork (house, bouncy castle, balloons, tree, gifts, fence, cake, etc.).
 *
 * The image is mapped onto a single plane in the menu area (below the gameplay
 * frame). Its top (sky) is alpha-faded to transparent so the cosmetic-
 * recolorable sky gradient behind it (ParallaxBackground, z=-90) bleeds through
 * and blends seamlessly into the gameplay sky above - no hard seam regardless
 * of which cosmetic background color the player has equipped.
 *
 * World layout: gameplay frame is centered on y=0 (visible y in [-480, 480]);
 * the menu frame is centered on y=-LOGICAL_HEIGHT (visible y in [-1440, -480]).
 * The image top is anchored at the y=-480 boundary.
 */

/** Fraction of the image height (from the top) over which the sky fades out. */
const SKY_FADE_FRACTION = 0.35;
/** World-y boundary between the menu frame and the gameplay frame. */
const MENU_TOP_Y = -LOGICAL_HEIGHT / 2;

export class PartyScene {
  readonly group = new THREE.Group();

  constructor() {
    // In front of the sky gradient (z=-90) but behind gameplay balloons (z=0).
    this.group.position.z = -50;
  }

  /**
   * Loads A_House.png, fades its sky into transparency, and builds the plane.
   * Resolves even on error so boot never hangs (the menu just falls back to the
   * bare cosmetic sky if the art fails to load).
   */
  load(): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.buildMesh(img);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = houseUrl;
    });
  }

  private buildMesh(img: HTMLImageElement): void {
    const natW = img.naturalWidth || img.width;
    const natH = img.naturalHeight || img.height;

    const canvas = document.createElement('canvas');
    canvas.width = natW;
    canvas.height = natH;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, natW, natH);
      // Erase the upper sky into transparency with a top-down alpha ramp so the
      // cosmetic sky behind shows through and blends across the boundary.
      const fadeEnd = natH * SKY_FADE_FRACTION;
      const grad = ctx.createLinearGradient(0, 0, 0, fadeEnd);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, natW, fadeEnd);
      ctx.globalCompositeOperation = 'source-over';
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;

    // Scale to COVER the menu frame so there is never a gap at the edges.
    const scale = Math.max(LOGICAL_WIDTH / natW, LOGICAL_HEIGHT / natH);
    const w = natW * scale;
    const h = natH * scale;

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
    );
    // Anchor the image top at the menu/gameplay boundary so the faded sky meets
    // the gameplay sky exactly, and the scene fills downward into the menu view.
    mesh.position.set(0, MENU_TOP_Y - h / 2, 0);
    this.group.add(mesh);
  }

  // The art is a single static plane; nothing to animate here. The drifting
  // clouds in ParallaxBackground keep the gameplay sky feeling alive.
  update(_dt: number): void {}
}
