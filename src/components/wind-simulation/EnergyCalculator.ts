export class EnergyCalculator {
  private energyHistory: { time: number; value: number }[] = [];
  private readonly HISTORY_DURATION = 3000; // 3 seconds

  constructor() {}

  public addEnergyReading(value: number) {
    const now = performance.now();
    this.energyHistory.push({ time: now, value });
    
    // Clean up old readings
    this.energyHistory = this.energyHistory.filter(
      reading => now - reading.time <= this.HISTORY_DURATION
    );
  }

  public getAverageEnergy(): number {
    if (this.energyHistory.length === 0) return 0;
    const sum = this.energyHistory.reduce((acc, curr) => acc + curr.value, 0);
    return sum / this.energyHistory.length;
  }
}