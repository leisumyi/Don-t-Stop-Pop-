import * as THREE from 'three';
import cloudAUrl from '../../images/A_Cloud.png';
import cloudBUrl from '../../images/B_Cloud.png';

export interface CloudTexture {
  texture: THREE.Texture;
  aspect: number;
}

let cache: CloudTexture[] | null = null;
let promise: Promise<CloudTexture[]> | null = null;

function loadOne(url: string): Promise<CloudTexture | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) return resolve(null);
      const texture = new THREE.Texture(img);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      resolve({ texture, aspect: w / h });
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Loads both cloud PNGs once and caches them. Resolves even on error (with
 * whatever loaded) so boot never hangs; callers fall back to a procedural cloud
 * when nothing is available.
 */
export function loadCloudTextures(): Promise<CloudTexture[]> {
  if (promise) return promise;
  promise = Promise.all([loadOne(cloudAUrl), loadOne(cloudBUrl)]).then((r) => {
    cache = r.filter((x): x is CloudTexture => x !== null);
    return cache;
  });
  return promise;
}

/** Returns a random loaded cloud texture, or null if none are ready. */
export function randomCloudTexture(): CloudTexture | null {
  if (!cache || cache.length === 0) return null;
  return cache[Math.floor(Math.random() * cache.length)];
}
