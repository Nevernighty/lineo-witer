// Pure turbulence functions

/**
 * Perlin-like noise (cheap 3-octave sin/cos approximation)
 */
export function turbulenceNoise(
  x: number, y: number, z: number,
  time: number, scale: number
): number {
  const f1 = scale * 0.1, f2 = scale * 0.2, f3 = scale * 0.4;
  const n1 = Math.sin(x * f1 + time) * Math.cos(y * f1 - time * 0.5) * Math.sin(z * f1 + time * 0.3);
  const n2 = Math.sin(x * f2 - time * 1.3) * Math.cos(y * f2 + time * 0.7) * Math.cos(z * f2 - time * 0.2);
  const n3 = Math.cos(x * f3 + time * 0.8) * Math.sin(y * f3 - time * 0.4) * Math.sin(z * f3 + time * 1.1);
  return (n1 + n2 * 0.5 + n3 * 0.25) / 1.75;
}

/**
 * Turbulence intensity at reference: IEC standard approximation
 */
export function computeTurbulenceIntensity(
  meanWindSpeed: number,
  _surfaceRoughness: number,
  _height: number
): number {
  const Iref = 0.16;
  return Iref * (0.75 + 5.6 / Math.max(meanWindSpeed, 0.5));
}

/**
 * Compute turbulence displacement vector
 */
export function computeTurbulenceDisplacement(
  px: number, py: number, pz: number,
  time: number,
  turbulenceIntensity: number,
  turbulenceScale: number,
  effectiveSpeed: number
): { dx: number; dy: number; dz: number } {
  const magnitude = turbulenceIntensity * effectiveSpeed;
  return {
    dx: turbulenceNoise(px, py, pz, time, turbulenceScale) * magnitude,
    dy: turbulenceNoise(px + 100, py + 100, pz, time * 1.3, turbulenceScale) * magnitude * 0.3,
    dz: turbulenceNoise(px, py, pz + 100, time * 0.7, turbulenceScale) * magnitude,
  };
}
