// Pure terrain functions

/**
 * Y-offset for a point on a sloped terrain plane
 */
export function getTerrainYOffset(
  x: number, z: number,
  slopeXDeg: number, slopeZDeg: number
): number {
  const sxRad = (slopeXDeg * Math.PI) / 180;
  const szRad = (slopeZDeg * Math.PI) / 180;
  const raw = -Math.sin(sxRad) * x - Math.sin(szRad) * z;
  return Math.max(-15, Math.min(15, raw));
}

/**
 * Simplified slope speed-up factor
 * multiplier = 1 + slopeAngle * 0.2, capped at 1.4
 *
 * Approximation of hill speed-up effect for real-time visualization.
 */
export function computeSlopeSpeedup(
  baseSpeed: number,
  slopeAngleDeg: number
): number {
  const multiplier = Math.min(1.4, 1 + Math.abs(slopeAngleDeg) * 0.2);
  return baseSpeed * multiplier;
}

/**
 * Legacy terrain speed-up (hill effect): empirical factor using tan()
 * Kept for backward compatibility.
 */
export function computeTerrainSpeedup(
  baseSpeed: number,
  slopeAngleDeg: number
): number {
  const slopeRad = (slopeAngleDeg * Math.PI) / 180;
  const speedup = 1 + 1.6 * Math.abs(Math.tan(slopeRad)) * 0.5;
  return baseSpeed * Math.min(speedup, 1.8);
}

/**
 * Air density from altitude + temperature (barometric formula)
 */
export function computeAirDensity(altitude: number, temperature: number): number {
  const T0 = 288.15, P0 = 101325, L = 0.0065;
  const g = 9.81, M = 0.0289644, R = 8.3145;
  const T = T0 - L * altitude;
  const P = P0 * Math.pow(T / T0, (g * M) / (R * L));
  const rho = (P * M) / (R * (temperature + 273.15));
  return Math.max(0.5, Math.min(1.5, rho));
}
