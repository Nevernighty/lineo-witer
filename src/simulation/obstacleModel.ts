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

// ---------------------------------------------------------------------------
// Edge speed-up and separation bubble over roofs and ridges
// ---------------------------------------------------------------------------

/**
 * Flow acceleration over the windward edge of a bluff body.
 *
 * Streamlines compress over the leading edge, so a rooftop turbine sees a
 * speed-up of up to ~1.25·V in a shallow layer above the roof that decays with
 * height (thickness ≈ 0.35·H) and with distance downstream of the edge.
 *
 * Returns a multiplier ≥ 1.
 */
export function computeEdgeSpeedup(
  px: number, py: number, pz: number,
  cx: number, cy: number, cz: number,
  width: number, height: number, depth: number,
  windDirX: number, windDirZ: number
): number {
  const H = Math.max(0.5, height);
  const roofY = cy + H / 2;
  const above = py - roofY;
  if (above < 0) return 1;

  const layer = 0.35 * H;
  if (above > layer * 2.2) return 1;

  const toX = px - cx;
  const toZ = pz - cz;
  const streamwise = toX * windDirX + toZ * windDirZ;
  const halfSpan = (Math.abs(width * windDirX) + Math.abs(depth * windDirZ)) / 2;
  // Only over the body and a little past its trailing edge.
  if (streamwise < -halfSpan * 1.2 || streamwise > halfSpan * 1.4) return 1;

  const lateral = Math.abs(toX * windDirZ - toZ * windDirX);
  const halfW = (Math.abs(width * windDirZ) + Math.abs(depth * windDirX)) / 2;
  if (lateral > halfW * 1.25) return 1;

  const heightFall = Math.exp(-((above / layer) ** 1.6));
  const edgeProximity = Math.exp(-(((streamwise + halfSpan) / (halfSpan * 1.1)) ** 2) * 0.6);
  const lateralFall = Math.exp(-1.2 * (lateral / Math.max(0.001, halfW)) ** 2);

  return 1 + 0.26 * heightFall * edgeProximity * lateralFall;
}

/**
 * Rooftop separation bubble.
 *
 * Right behind the windward parapet the flow detaches and recirculates: the
 * streamwise component reverses and vertical mixing spikes. The bubble is about
 * 0.5·H tall and reattaches at roughly 1.5·H downstream of the edge.
 *
 * Returns 0 (attached flow) .. 1 (fully inside the reversed core).
 */
export function computeSeparationBubble(
  px: number, py: number, pz: number,
  cx: number, cy: number, cz: number,
  width: number, height: number, depth: number,
  windDirX: number, windDirZ: number
): number {
  const H = Math.max(0.5, height);
  const roofY = cy + H / 2;
  const above = py - roofY;
  if (above < 0 || above > 0.5 * H) return 0;

  const toX = px - cx;
  const toZ = pz - cz;
  const streamwise = toX * windDirX + toZ * windDirZ;
  const halfSpan = (Math.abs(width * windDirX) + Math.abs(depth * windDirZ)) / 2;
  const fromEdge = streamwise + halfSpan;
  const reattach = 1.5 * H;
  if (fromEdge < 0 || fromEdge > reattach) return 0;

  const lateral = Math.abs(toX * windDirZ - toZ * windDirX);
  const halfW = (Math.abs(width * windDirZ) + Math.abs(depth * windDirX)) / 2;
  if (lateral > halfW) return 0;

  const along = Math.sin((fromEdge / reattach) * Math.PI);
  const vert = 1 - above / (0.5 * H);
  return Math.max(0, along * vert);
}
