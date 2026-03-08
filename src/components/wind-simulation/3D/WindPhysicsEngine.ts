// Advanced Wind Physics Engine with real-world parameters
// Based on wind energy research and turbulence modeling
//
// NOTE: Pure physics functions have been extracted to src/simulation/*.ts
// This file re-exports them for backward compatibility.

export interface WindPhysicsConfig {
  windSpeed: number;
  windAngle: number;
  windElevation: number;
  turbulenceIntensity: number;
  turbulenceScale: number;
  gustFrequency: number;
  gustIntensity: number;
  airDensity: number;
  temperature: number;
  humidity: number;
  altitude: number;
  surfaceRoughness: number;
  referenceHeight: number;
  terrainSlopeX: number;
  terrainSlopeZ: number;
}

export interface ObstaclePhysics {
  dragCoefficient: number;
  porosityFactor: number;
  turbulenceGeneration: number;
  wakeLength: number;
  separationAngle: number;
}

export const OBSTACLE_DRAG_COEFFICIENTS: Record<string, ObstaclePhysics> = {
  tree: { dragCoefficient: 0.4, porosityFactor: 0.6, turbulenceGeneration: 0.8, wakeLength: 15, separationAngle: 45 },
  building: { dragCoefficient: 1.4, porosityFactor: 0.0, turbulenceGeneration: 1.2, wakeLength: 25, separationAngle: 15 },
  skyscraper: { dragCoefficient: 1.6, porosityFactor: 0.0, turbulenceGeneration: 1.5, wakeLength: 50, separationAngle: 10 },
  tower: { dragCoefficient: 0.8, porosityFactor: 0.3, turbulenceGeneration: 0.6, wakeLength: 20, separationAngle: 30 },
  house: { dragCoefficient: 1.2, porosityFactor: 0.0, turbulenceGeneration: 0.9, wakeLength: 15, separationAngle: 20 },
  wall: { dragCoefficient: 2.0, porosityFactor: 0.0, turbulenceGeneration: 1.3, wakeLength: 10, separationAngle: 5 },
  fence: { dragCoefficient: 1.0, porosityFactor: 0.5, turbulenceGeneration: 0.7, wakeLength: 8, separationAngle: 25 },
  wind_generator: { dragCoefficient: 0.3, porosityFactor: 0.7, turbulenceGeneration: 0.4, wakeLength: 12, separationAngle: 35 },
};

// Delegate to simulation core
import { computeWindShear } from '@/simulation/windField';
import { computeGustMultiplier } from '@/simulation/windField';
import { turbulenceNoise as turbNoiseCore } from '@/simulation/turbulenceModel';
import { computeTurbulenceIntensity } from '@/simulation/turbulenceModel';
import { computeAirDensity } from '@/simulation/terrainModel';
import { computeTerrainSpeedup } from '@/simulation/terrainModel';
import { isInWakeZone as isInWakeZoneCore, computeWakeDeficit } from '@/simulation/wakeModel';

export function calculateAirDensity(altitude: number, temperature: number): number {
  return computeAirDensity(altitude, temperature);
}

export function calculateWindShear(
  baseSpeed: number, baseHeight: number, targetHeight: number, roughnessLength: number
): number {
  return computeWindShear(baseSpeed, baseHeight, targetHeight, roughnessLength);
}

export function calculateTerrainSpeedup(baseSpeed: number, slopeAngleDeg: number): number {
  return computeTerrainSpeedup(baseSpeed, slopeAngleDeg);
}

export function calculateTurbulenceIntensity(
  meanWindSpeed: number, surfaceRoughness: number, height: number
): number {
  return computeTurbulenceIntensity(meanWindSpeed, surfaceRoughness, height);
}

export function turbulenceNoise(x: number, y: number, z: number, time: number, scale: number): number {
  return turbNoiseCore(x, y, z, time, scale);
}

export function calculateGust(
  time: number, gustFrequency: number, gustIntensity: number, baseSpeed: number
): number {
  return baseSpeed * computeGustMultiplier(time, gustFrequency, gustIntensity);
}

export function calculateDragForce(
  particleVelocity: { x: number; y: number; z: number },
  obstaclePhysics: ObstaclePhysics,
  airDensity: number,
  particleArea: number
): { x: number; y: number; z: number } {
  const speed = Math.sqrt(particleVelocity.x ** 2 + particleVelocity.y ** 2 + particleVelocity.z ** 2);
  if (speed < 0.01) return { x: 0, y: 0, z: 0 };
  const dragMagnitude = 0.5 * airDensity * speed * speed * obstaclePhysics.dragCoefficient * particleArea;
  const effectiveDrag = dragMagnitude * (1 - obstaclePhysics.porosityFactor);
  return {
    x: -effectiveDrag * (particleVelocity.x / speed),
    y: -effectiveDrag * (particleVelocity.y / speed),
    z: -effectiveDrag * (particleVelocity.z / speed),
  };
}

export function isInWakeZone(
  particlePos: { x: number; y: number; z: number },
  obstaclePos: { x: number; y: number; z: number },
  obstacleSize: { width: number; height: number; depth: number },
  windDirection: { x: number; z: number },
  wakeLength: number
): boolean {
  return isInWakeZoneCore(
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
  return originalSpeed * computeWakeDeficit(distance, wakeLength);
}

export const DEFAULT_WIND_PHYSICS: WindPhysicsConfig = {
  windSpeed: 8, windAngle: 0, windElevation: 0,
  turbulenceIntensity: 0.3, turbulenceScale: 1.0,
  gustFrequency: 6, gustIntensity: 0.2,
  airDensity: 1.225, temperature: 15, humidity: 50, altitude: 0,
  surfaceRoughness: 0.3, referenceHeight: 10,
  terrainSlopeX: 0, terrainSlopeZ: 0,
};
