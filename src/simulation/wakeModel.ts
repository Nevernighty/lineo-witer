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

// ---------------------------------------------------------------------------
// Bluff-body (building / tree / wall) wake — near, transition and far regions
// ---------------------------------------------------------------------------

export interface BluffWakeSample {
  inWake: boolean;
  /** Local velocity multiplier (0..1). */
  velocityFactor: number;
  /** Added turbulence intensity in the wake (0..1+). */
  tiBoost: number;
  /** Streamwise distance behind the body (m). */
  downstream: number;
  /** 1 inside the recirculation bubble, fading to 0 at the reattachment point. */
  recirculation: number;
}

const NO_WAKE: BluffWakeSample = {
  inWake: false, velocityFactor: 1, tiBoost: 0, downstream: 0, recirculation: 0,
};

/**
 * Expanding-cone wake behind a solid obstacle.
 *
 * Near wake (x < 1.5·H): recirculation, deficit close to its maximum.
 * Transition (1.5·H .. 3·H): deficit holds, the cone widens fast.
 * Far wake (x > 3·H): centreline deficit decays as (x/x0)^(-2/3), the classic
 * two-dimensional bluff-body recovery law.
 *
 * Lateral and vertical shape are Gaussian across the expanded cone, so a point
 * clipping the wake edge only feels a fraction of the deficit — this is what
 * produces the readable "influence zone" instead of a hard on/off box.
 */
export function sampleBluffBodyWake(
  px: number, py: number, pz: number,
  cx: number, cy: number, cz: number,
  width: number, height: number, depth: number,
  windDirX: number, windDirZ: number,
  dragCoefficient = 1.2,
  porosity = 0,
  wakeDecayK = 0.11
): BluffWakeSample {
  const toX = px - cx;
  const toZ = pz - cz;
  const downstream = toX * windDirX + toZ * windDirZ;
  if (downstream <= 0) return NO_WAKE;

  const H = Math.max(0.5, height);
  const maxDist = Math.max(8 * H, 6 * Math.max(width, depth));
  if (downstream > maxDist) return { ...NO_WAKE, downstream };

  // Frontal footprint projected onto the cross-wind axis.
  const frontalHalfW =
    (Math.abs(width * windDirZ) + Math.abs(depth * windDirX)) / 2 || Math.max(width, depth) / 2;

  const halfW = frontalHalfW + wakeDecayK * downstream;
  const halfH = H / 2 + wakeDecayK * 0.7 * downstream;

  const lateral = Math.abs(toX * windDirZ - toZ * windDirX);
  const vertical = py - cy;

  if (lateral > halfW * 1.8 || Math.abs(vertical) > halfH * 1.9) {
    return { ...NO_WAKE, downstream };
  }

  // Centreline deficit strength.
  const solidity = Math.max(0, 1 - porosity);
  const peak = Math.min(0.92, 0.55 * dragCoefficient * solidity);
  const nearLen = 1.5 * H;
  const transitionEnd = 3 * H;
  let centreDeficit: number;
  if (downstream < nearLen) centreDeficit = peak;
  else if (downstream < transitionEnd) centreDeficit = peak * (1 - 0.12 * ((downstream - nearLen) / (transitionEnd - nearLen)));
  else centreDeficit = peak * 0.88 * Math.pow(transitionEnd / downstream, 2 / 3);

  const shape =
    Math.exp(-1.4 * (lateral / halfW) ** 2) *
    Math.exp(-1.2 * (vertical / halfH) ** 2);

  const deficit = centreDeficit * shape;
  const reattach = nearLen;
  const recirculation = downstream < reattach ? (1 - downstream / reattach) * shape : 0;

  return {
    inWake: deficit > 0.01,
    velocityFactor: Math.max(0.05, 1 - deficit),
    tiBoost: deficit * 1.15,
    downstream,
    recirculation,
  };
}
