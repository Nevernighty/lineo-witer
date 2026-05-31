import type { BladeGeometry } from '@/aero/bem';
import { solveBEM, solveVAWT } from '@/aero/bem';
import type { RotorType } from '@/aero/buildBladeGeometry';

export class EnergyCalculator {
  private energyHistory: { time: number; value: number }[] = [];
  private readonly HISTORY_DURATION = 3000; // 3 seconds window

  constructor() {}

  public addEnergyReading(value: number) {
    const now = performance.now();
    this.energyHistory.push({ time: now, value });
    
    // Clean up readings older than 3 seconds
    this.energyHistory = this.energyHistory.filter(
      reading => now - reading.time <= this.HISTORY_DURATION
    );
  }

  public getAverageEnergy(): number {
    if (this.energyHistory.length === 0) return 0;
    
    // Calculate weighted average based on time
    const now = performance.now();
    let totalWeight = 0;
    let weightedSum = 0;
    
    this.energyHistory.forEach(reading => {
      const age = now - reading.time;
      const weight = 1 - (age / this.HISTORY_DURATION);
      weightedSum += reading.value * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
}

export function computePowerFromBladeGeometry(
  geometry: BladeGeometry,
  rotorType: RotorType,
  windSpeed: number,
  airDensity: number,
  options: { heightOverDiameter?: number; tsr?: number } = {}
) {
  const tsr = options.tsr ?? (rotorType === 'vawt-savonius' ? 0.9 : rotorType === 'hawt' ? 7 : 4.5);
  const omega = (tsr * windSpeed) / Math.max(0.1, geometry.tipRadius);
  const result = rotorType === 'hawt'
    ? solveBEM(geometry, { V: windSpeed, omega, rho: airDensity }, 18)
    : solveVAWT(geometry, { V: windSpeed, omega, rho: airDensity }, { rotorType: rotorType as Exclude<RotorType, 'hawt'>, heightOverDiameter: options.heightOverDiameter }, 24);
  return { power: Math.max(0, result.power), cp: result.cp, ct: result.ct, tsr };
}