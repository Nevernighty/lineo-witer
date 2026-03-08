// Pure obstacle collision/deflection functions
import type { ObstacleData } from './types';

/**
 * AABB collision check with rotation support
 */
export function checkCollision(
  px: number, py: number, pz: number,
  obs: ObstacleData,
  margin = 1.5
): boolean {
  const scale = obs.scale || 1;
  const halfW = (obs.width * scale) / 2;
  const halfH = (obs.height * scale) / 2;
  const halfD = (obs.depth * scale) / 2;
  const cx = obs.x + obs.width / 2;
  const cy = obs.y + obs.height / 2;
  const cz = obs.z + obs.depth / 2;

  let dx = px - cx;
  let dz = pz - cz;
  const dy = py - cy;

  const rotY = -((obs.rotation || 0) * Math.PI) / 180;
  if (rotY !== 0) {
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const nx = dx * cosY - dz * sinY;
    const nz = dx * sinY + dz * cosY;
    dx = nx;
    dz = nz;
  }

  return (
    dx >= -halfW - margin && dx <= halfW + margin &&
    dy >= -halfH - margin && dy <= halfH + margin &&
    dz >= -halfD - margin && dz <= halfD + margin
  );
}

/**
 * Surface normal (dominant-axis) with rotation
 */
export function getSurfaceNormal(
  px: number, py: number, pz: number,
  obs: ObstacleData
): [number, number, number] {
  const scale = obs.scale || 1;
  const cx = obs.x + obs.width / 2;
  const cy = obs.y + obs.height / 2;
  const cz = obs.z + obs.depth / 2;
  const dx = (px - cx) / (obs.width * scale);
  const dy = (py - cy) / (obs.height * scale);
  const dz = (pz - cz) / (obs.depth * scale);
  const adx = Math.abs(dx), ady = Math.abs(dy), adz = Math.abs(dz);

  let nx = 0, ny = 0, nz = 0;
  if (adx > ady && adx > adz) nx = Math.sign(dx);
  else if (ady > adz) ny = Math.sign(dy);
  else nz = Math.sign(dz);

  const rotAngle = ((obs.rotation || 0) * Math.PI) / 180;
  if (rotAngle !== 0) {
    const cosY = Math.cos(rotAngle);
    const sinY = Math.sin(rotAngle);
    return [nx * cosY + nz * sinY, ny, -nx * sinY + nz * cosY];
  }
  return [nx, ny, nz];
}

/**
 * Exponential obstacle shadow model
 *
 * shadowFactor = exp(-distance / obstacleSize)
 *
 * Returns wind speed reduction factor (0..1) behind buildings.
 * 0 = full shadow (right behind obstacle), 1 = no shadow (far away).
 */
export function computeObstacleShadow(
  distance: number,
  obstacleSize: number
): number {
  if (obstacleSize <= 0) return 1;
  return 1 - Math.exp(-distance / obstacleSize);
}

/** Drag coefficients per obstacle type */
export const OBSTACLE_PHYSICS: Record<string, {
  dragCoefficient: number;
  porosityFactor: number;
  turbulenceGeneration: number;
  wakeLength: number;
  separationAngle: number;
}> = {
  tree: { dragCoefficient: 0.4, porosityFactor: 0.6, turbulenceGeneration: 0.8, wakeLength: 15, separationAngle: 45 },
  building: { dragCoefficient: 1.4, porosityFactor: 0.0, turbulenceGeneration: 1.2, wakeLength: 25, separationAngle: 15 },
  skyscraper: { dragCoefficient: 1.6, porosityFactor: 0.0, turbulenceGeneration: 1.5, wakeLength: 50, separationAngle: 10 },
  tower: { dragCoefficient: 0.8, porosityFactor: 0.3, turbulenceGeneration: 0.6, wakeLength: 20, separationAngle: 30 },
  house: { dragCoefficient: 1.2, porosityFactor: 0.0, turbulenceGeneration: 0.9, wakeLength: 15, separationAngle: 20 },
  wall: { dragCoefficient: 2.0, porosityFactor: 0.0, turbulenceGeneration: 1.3, wakeLength: 10, separationAngle: 5 },
  fence: { dragCoefficient: 1.0, porosityFactor: 0.5, turbulenceGeneration: 0.7, wakeLength: 8, separationAngle: 25 },
  wind_generator: { dragCoefficient: 0.3, porosityFactor: 0.7, turbulenceGeneration: 0.4, wakeLength: 12, separationAngle: 35 },
};
