// Pure wind field functions — no React, no Three.js
import type { SimulationParams, WindVector } from './types';

/** Roughness length lookup (m) */
export const ROUGHNESS_LENGTHS: Record<string, number> = {
  water: 0.0002,
  grassland: 0.03,
  forest: 0.8,
  urban: 1.5,
};

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
 * Logarithmic wind shear profile
 * U(z) = Uref * ln(z / z0) / ln(zref / z0)
 *
 * More physically accurate than power-law for neutral atmospheric conditions.
 */
export function computeLogWindShear(
  baseSpeed: number,
  refHeight: number,
  targetHeight: number,
  roughnessLength: number
): number {
  const z = Math.max(roughnessLength + 0.01, targetHeight);
  const zRef = Math.max(roughnessLength + 0.01, refHeight);
  const logZ = Math.log(z / roughnessLength);
  const logZRef = Math.log(zRef / roughnessLength);
  if (logZRef <= 0) return baseSpeed;
  return baseSpeed * logZ / logZRef;
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
  const shearFn = params.shearModel === 'log' ? computeLogWindShear : computeWindShear;
  const shearedSpeed = shearFn(
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

// ---------------------------------------------------------------------------
// Realism upgrades: displacement height, default log profile, coherent gusts
// ---------------------------------------------------------------------------

/**
 * Zero-plane displacement height d (m).
 *
 * Over rough canopies (forest, urban) the flow "sees" a floor lifted to ~0.7·h
 * of the roughness elements. With the usual z0 ≈ 0.1·h that gives d ≈ 7·z0.
 * Smooth terrain (water, grass) has no meaningful displacement.
 */
export function displacementHeight(roughnessLength: number): number {
  if (roughnessLength <= 0.1) return 0;
  return Math.min(20, 7 * roughnessLength);
}

/**
 * Neutral log-law profile including zero-plane displacement:
 *   U(z) = Uref · ln((z−d)/z0) / ln((zref−d)/z0)
 *
 * This is the physically correct default for the boundary layer and, unlike the
 * bare log law, it stops the flow from being over-speeded just above rooftops
 * and tree canopies.
 */
export function computeLogWindShearDisplaced(
  baseSpeed: number,
  refHeight: number,
  targetHeight: number,
  roughnessLength: number
): number {
  const z0 = Math.max(0.0002, roughnessLength);
  const d = displacementHeight(z0);
  const z = Math.max(z0 * 1.05, targetHeight - d);
  const zRef = Math.max(z0 * 1.05, Math.max(refHeight, d + z0 * 2) - d);
  const logZ = Math.log(z / z0);
  const logRef = Math.log(zRef / z0);
  if (logRef <= 0) return baseSpeed;
  return baseSpeed * Math.max(0, logZ) / logRef;
}

/**
 * Coherent gust cells.
 *
 * Instead of one global sine applied everywhere at once, gusts are modelled as
 * finite-size parcels of faster air advecting downstream with the mean flow.
 * A point only feels a gust while a cell is passing over it, so the arrival of
 * a gust is visible travelling through the domain.
 */
export function computeGustCellMultiplier(
  x: number,
  z: number,
  time: number,
  gustFrequency: number,
  gustIntensity: number,
  windDirX: number,
  windDirZ: number,
  meanSpeed: number,
  cellLength = 60
): number {
  if (gustFrequency <= 0 || gustIntensity <= 0) return 1;
  const advect = Math.max(1, meanSpeed);
  // Streamwise coordinate of the point, converted to a travelling phase.
  const s = x * windDirX + z * windDirZ;
  const period = 60 / gustFrequency;
  const phase = (time - s / advect) / period;
  const frac = phase - Math.floor(phase);

  // Asymmetric gust envelope: fast rise, slower relaxation (IEC-like shape).
  let env = 0;
  if (frac < 0.18) env = Math.sin((frac / 0.18) * Math.PI * 0.5);
  else if (frac < 0.34) env = 1;
  else if (frac < 0.62) env = Math.cos(((frac - 0.34) / 0.28) * Math.PI * 0.5);

  // Lateral coherence: neighbouring streamlines share the cell but not exactly.
  const lateral = x * -windDirZ + z * windDirX;
  const coherence = 0.75 + 0.25 * Math.cos((lateral / Math.max(8, cellLength * 0.5)) * Math.PI);

  return 1 + gustIntensity * env * coherence;
}
