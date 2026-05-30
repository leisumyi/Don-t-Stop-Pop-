import * as THREE from 'three';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from './constants';

/**
 * Orthographic camera with the world origin at the center, x in
 * [-LOGICAL_WIDTH/2, +LOGICAL_WIDTH/2], y in [-LOGICAL_HEIGHT/2, +LOGICAL_HEIGHT/2].
 */
export function createCamera(): THREE.OrthographicCamera {
  const halfW = LOGICAL_WIDTH / 2;
  const halfH = LOGICAL_HEIGHT / 2;
  const cam = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, -1000, 1000);
  cam.position.z = 100;
  return cam;
}
