// Pure wake-zone computation

export interface WakeParams {
  wakeLength: number;
  turbulenceGeneration: number;
}

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
 * Velocity deficit in the wake: exponential recovery
 */
export function computeWakeDeficit(
  distance: number,
  wakeLength: number
): number {
  const norm = distance / wakeLength;
  const deficit = Math.exp(-2 * norm);
  return 1 - 0.6 * deficit;
}
