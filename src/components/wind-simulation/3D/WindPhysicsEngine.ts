// WindPhysicsEngine — barrel re-export for backward compatibility
// All physics logic now lives in src/simulation/ modules

// Re-export types
export type { WindPhysicsConfig } from './WindPhysicsEngineTypes';
export { DEFAULT_WIND_PHYSICS } from './WindPhysicsEngineTypes';

// Re-export from simulation core (aliased to original names)
export { computeWindShear as calculateWindShear } from '@/simulation/windField';
export { computeGustMultiplier as calculateGust_internal } from '@/simulation/windField';
export { turbulenceNoise } from '@/simulation/turbulenceModel';
export { computeTurbulenceIntensity as calculateTurbulenceIntensity } from '@/simulation/turbulenceModel';
export { computeAirDensity as calculateAirDensity } from '@/simulation/terrainModel';
export { computeTerrainSpeedup as calculateTerrainSpeedup } from '@/simulation/terrainModel';
export { isInWakeZone as isInWakeZone_sim } from '@/simulation/wakeModel';
export { computeWakeDeficit as calculateWakeVelocity_sim } from '@/simulation/wakeModel';
export { OBSTACLE_PHYSICS as OBSTACLE_DRAG_COEFFICIENTS_NEW } from '@/simulation/obstacleModel';

// Keep original exports for callers that haven't migrated yet
import { WindPhysicsConfig, DEFAULT_WIND_PHYSICS } from './WindPhysicsEngineTypes';
import { computeWindShear } from '@/simulation/windField';
import { turbulenceNoise as turbNoise } from '@/simulation/turbulenceModel';

// Legacy API wrappers
export function calculateWindShear(
  baseSpeed: number, baseHeight: number, targetHeight: number, roughnessLength: number
): number {
  return computeWindShear(baseSpeed, baseHeight, targetHeight, roughnessLength);
}

export { turbNoise as turbulenceNoise };

export function calculateGust(
  time: number, gustFrequency: number, gustIntensity: number, baseSpeed: number
): number {
  const { computeGustMultiplier } = require('@/simulation/windField');
  return baseSpeed * computeGustMultiplier(time, gustFrequency, gustIntensity);
}

export function isInWakeZone(
  particlePos: { x: number; y: number; z: number },
  obstaclePos: { x: number; y: number; z: number },
  obstacleSize: { width: number; height: number; depth: number },
  windDirection: { x: number; z: number },
  wakeLength: number
): boolean {
  const { isInWakeZone: isWake } = require('@/simulation/wakeModel');
  return isWake(
    particlePos.x, particlePos.z,
    obstaclePos.x, obstaclePos.z,
    obstacleSize.width, obstacleSize.depth,
    windDirection.x, windDirection.z,
    wakeLength
  );
}

export function calculateWakeVelocity(
  distance: number, wakeLength: number, originalSpeed: number
): number {
  const { computeWakeDeficit } = require('@/simulation/wakeModel');
  return originalSpeed * computeWakeDeficit(distance, wakeLength);
}

export { OBSTACLE_DRAG_COEFFICIENTS } from './WindPhysicsEngineConstants';

export interface ObstaclePhysics {
  dragCoefficient: number;
  porosityFactor: number;
  turbulenceGeneration: number;
  wakeLength: number;
  separationAngle: number;
}

export function calculateDragForce(
  particleVelocity: { x: number; y: number; z: number },
  obstaclePhysics: ObstaclePhysics,
  airDensity: number,
  particleArea: number
): { x: number; y: number; z: number } {
  const speed = Math.sqrt(
    particleVelocity.x ** 2 + 
    particleVelocity.y ** 2 + 
    particleVelocity.z ** 2
  );
  
  if (speed < 0.01) return { x: 0, y: 0, z: 0 };
  
  const dragMagnitude = 0.5 * airDensity * speed * speed * obstaclePhysics.dragCoefficient * particleArea;
  const effectiveDrag = dragMagnitude * (1 - obstaclePhysics.porosityFactor);
  
  return {
    x: -effectiveDrag * (particleVelocity.x / speed),
    y: -effectiveDrag * (particleVelocity.y / speed),
    z: -effectiveDrag * (particleVelocity.z / speed)
  };
}
