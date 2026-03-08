// Pure wake-zone computation

export interface WakeParams {
  wakeLength: number;
  turbulenceGeneration: number;
}

/** Roughness-dependent wake decay constants */
export const ROUGHNESS_WAKE_CONSTANTS: Record<string, number> = {
  offshore: 0.04,
  water: 0.04,
  grassland: 0.075,
  forest: 0.10,
  urban: 0.12,
};

/**
 * Check if a point is in the wake zone behind an obstacle
 */
export function isInWakeZone(
  px: number, pz: number,
  obsCx: number, obsCz: number,
  obsWidth: number, obsDepth: number,
  windDirX: number, windDirZ: number,
  wakeLength: number
): boolean {
  const toX = px - obsCx;
  const toZ = pz - obsCz;
  const dot = toX * windDirX + toZ * windDirZ;
  if (dot < 0) return false;

  const distance = Math.sqrt(toX * toX + toZ * toZ);
  if (distance > wakeLength) return false;

  const wakeWidth = Math.max(obsWidth, obsDepth) * (1 + distance / wakeLength);
  const cross = Math.abs(toX * windDirZ - toZ * windDirX);
  return cross < wakeWidth / 2;
}

/**
 * Velocity deficit in the wake: exponential recovery (legacy)
 */
export function computeWakeDeficit(
  distance: number,
  wakeLength: number
): number {
  const norm = distance / wakeLength;
  const deficit = Math.exp(-2 * norm);
  return 1 - 0.6 * deficit;
}

/**
 * Jensen/Park single-wake model
 *
 * velocityDeficit = 1 - (1 - sqrt(1 - Ct)) / (1 + k * x / r0)^2
 *
 * @param downstreamDistance - distance downstream from turbine (m)
 * @param rotorDiameter - rotor diameter (m)
 * @param thrustCoefficient - Ct, typically ~0.8
 * @param wakeDecayK - wake decay constant (0.04 offshore, 0.075 land)
 * @returns velocity ratio (0..1) where 1 = no deficit
 */
export function computeJensenWakeDeficit(
  downstreamDistance: number,
  rotorDiameter: number,
  thrustCoefficient: number = 0.8,
  wakeDecayK: number = 0.075
): number {
  if (downstreamDistance <= 0) return 1;
  const r0 = rotorDiameter / 2;
  const expansion = 1 + wakeDecayK * downstreamDistance / r0;
  const deficit = (1 - Math.sqrt(1 - thrustCoefficient)) / (expansion * expansion);
  return Math.max(0.2, 1 - deficit);
}

/**
 * Check if a point is in the wake zone behind a turbine using rotor swept area
 * Wake expands linearly with downstream distance
 */
export function isInTurbineWakeZone(
  px: number, py: number, pz: number,
  turbineCx: number, turbineCy: number, turbineCz: number,
  rotorDiameter: number,
  windDirX: number, windDirZ: number,
  wakeDecayK: number = 0.075,
  maxWakeDistance: number = 20 // in rotor diameters
): { inWake: boolean; distance: number } {
  const toX = px - turbineCx;
  const toZ = pz - turbineCz;

  // Downstream distance (dot product with wind direction)
  const downstream = toX * windDirX + toZ * windDirZ;
  if (downstream < 0) return { inWake: false, distance: 0 };

  const maxDist = maxWakeDistance * rotorDiameter;
  if (downstream > maxDist) return { inWake: false, distance: downstream };

  // Wake radius expands: r_wake = r0 + k * x
  const r0 = rotorDiameter / 2;
  const wakeRadius = r0 + wakeDecayK * downstream;

  // Cross-wind distance
  const crossX = toX - downstream * windDirX;
  const crossZ = toZ - downstream * windDirZ;
  const crossY = py - turbineCy;
  const crossDist = Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ);

  return { inWake: crossDist < wakeRadius, distance: downstream };
}
