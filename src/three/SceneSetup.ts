import * as THREE from 'three';
import { Renderer } from './Renderer';
import { ParallaxBackground } from './ParallaxBackground';
import { PartyScene } from './PartyScene';
import { CameraPan } from './CameraPan';

/**
 * Owns the Three.js scene + groups for gameplay layers. Provides accessors so
 * gameplay/hazard managers can attach meshes into the right Z-layer.
 */
export class SceneSetup {
  readonly renderer: Renderer;
  readonly background: ParallaxBackground;
  readonly partyScene: PartyScene;
  readonly cameraPan: CameraPan;
  readonly menuGroup: THREE.Group;
  readonly balloonGroup: THREE.Group;
  readonly actorGroup: THREE.Group;
  readonly hazardGroup: THREE.Group;
  readonly particleGroup: THREE.Group;
  readonly cloudCoverGroup: THREE.Group;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.background = new ParallaxBackground();
    this.renderer.scene.add(this.background.group);

    this.partyScene = new PartyScene();
    this.renderer.scene.add(this.partyScene.group);

    this.cameraPan = new CameraPan(this.renderer.camera);

    // Ambient menu balloons sit in front of the house image (z=-50) but behind
    // gameplay balloons (z=0).
    this.menuGroup = new THREE.Group();
    this.menuGroup.position.z = -10;
    this.renderer.scene.add(this.menuGroup);

    this.balloonGroup = new THREE.Group();
    this.balloonGroup.position.z = 0;
    this.renderer.scene.add(this.balloonGroup);

    this.actorGroup = new THREE.Group();
    this.actorGroup.position.z = 2;
    this.renderer.scene.add(this.actorGroup);

    this.hazardGroup = new THREE.Group();
    this.hazardGroup.position.z = 5;
    this.renderer.scene.add(this.hazardGroup);

    this.cloudCoverGroup = new THREE.Group();
    this.cloudCoverGroup.position.z = 10;
    this.renderer.scene.add(this.cloudCoverGroup);

    this.particleGroup = new THREE.Group();
    this.particleGroup.position.z = 20;
    this.renderer.scene.add(this.particleGroup);
  }

  /** Immediately place the camera at a world-y (e.g. on the menu at boot). */
  setCameraY(y: number): void {
    this.cameraPan.setY(y);
  }

  /** Smoothly pan the camera up/down to a target world-y. */
  panCameraTo(targetY: number, duration: number, onDone?: () => void): void {
    this.cameraPan.start(this.renderer.camera.position.y, targetY, duration, onDone);
  }

  update(dt: number): void {
    this.background.update(dt);
    this.partyScene.update(dt);
    this.cameraPan.update(dt);
  }

  render(): void {
    this.renderer.render();
  }
}
