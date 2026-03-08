// Pure wind field functions — no React, no Three.js
import type { SimulationParams, WindVector } from './types';

/**
 * Wind shear: power-law profile V(z) = V_ref * (z / z_ref)^alpha
 */
export function computeWindShear(
  baseSpeed: number,
  refHeight: number,
  targetHeight: number,
  roughnessLength: number
): number {
  const alpha = 0.096 * Math.log10(roughnessLength) + 0.016 * Math.pow(Math.log10(roughnessLength), 2) + 0.24;
  const clampedAlpha = Math.max(0.1, Math.min(0.4, alpha));
  return baseSpeed * Math.pow(Math.max(1, targetHeight) / refHeight, clampedAlpha);
}

/**
 * Gust envelope: shaped pulse with period = 60/freq seconds
 */
export function computeGustMultiplier(
  time: number,
  gustFrequency: number,
  gustIntensity: number
): number {
  if (gustFrequency <= 0) return 1;
  const gustPeriod = 60 / gustFrequency;
  const phase = (time % gustPeriod) / gustPeriod;

  const gustProfile = phase < 0.3
    ? Math.sin((phase / 0.3) * Math.PI / 2)
    : phase < 0.5
      ? 1
      : phase < 0.8
        ? Math.cos(((phase - 0.5) / 0.3) * Math.PI / 2)
        : 0;

  return 1 + gustIntensity * gustProfile;
}

/**
 * Base wind vector at a given height incorporating shear + gust + elevation
 */
export function computeBaseWind(
  params: SimulationParams,
  height: number,
  time: number
): WindVector {
  const shearedSpeed = computeWindShear(
    params.windSpeed,
    params.referenceHeight,
    height,
    params.surfaceRoughness
  );
  const gustMul = computeGustMultiplier(time, params.gustFrequency, params.gustIntensity);
  const effectiveSpeed = shearedSpeed * gustMul;

  const angleRad = (params.windAngle * Math.PI) / 180;
  const elevRad = (params.windElevation * Math.PI) / 180;

  return {
    x: Math.cos(angleRad) * Math.cos(elevRad) * effectiveSpeed,
    y: Math.sin(elevRad) * effectiveSpeed * 0.5,
    z: Math.sin(angleRad) * Math.cos(elevRad) * effectiveSpeed,
    magnitude: effectiveSpeed,
  };
}
