import { WindParticle, Obstacle, EnergyMarker } from "./types";
import { EnergyCalculator } from "./EnergyCalculator";

export class ParticleSystem {
  private particles: WindParticle[] = [];
  private trails: { points: { x: number; y: number }[]; lifetime: number }[] = [];
  private energyMarkers: EnergyMarker[] = [];
  private lastTime: number = performance.now();
  private readonly MAX_PARTICLES = 150;
  private energyCalculator: EnergyCalculator;
  
  constructor(
    private ctx: CanvasRenderingContext2D,
    private canvasWidth: number,
    private canvasHeight: number,
    private windSpeed: number,
    private windAngle: number,
    private windCurve: number,
    private particleDensity: number,
    private obstacles: Obstacle[]
  ) {
    this.energyCalculator = new EnergyCalculator();
    this.createParticles();
    this.initializeEnergyMarkers();
  }

  public updateDimensions(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.initializeEnergyMarkers();
  }

  private initializeEnergyMarkers() {
    this.energyMarkers = [
      { position: 'left', inflow: 0, outflow: 0 },
      { position: 'right', inflow: 0, outflow: 0 },
      { position: 'top', inflow: 0, outflow: 0 },
      { position: 'bottom', inflow: 0, outflow: 0 }
    ];
  }

  public addWindTrail(x: number, y: number, angle: number, power: number) {
    this.trails.push({
      points: [{ x, y }],
      lifetime: 60
    });
  }

  private createParticles() {
    const particleCount = Math.min(
      Math.floor(this.particleDensity * (this.canvasWidth * this.canvasHeight) / 100000),
      this.MAX_PARTICLES
    );
    
    while (this.particles.length < particleCount) {
      this.particles.push(this.createNewParticle());
    }

    // Remove excess particles if density is lowered
    if (this.particles.length > particleCount) {
      this.particles.length = particleCount;
    }
  }

  private createNewParticle(x?: number, y?: number): WindParticle {
    const angleRad = (this.windAngle * Math.PI) / 180;
    return {
      x: x ?? Math.random() * this.canvasWidth,
      y: y ?? Math.random() * this.canvasHeight,
      size: Math.random() * 2 + 1,
      speedX: Math.cos(angleRad) * this.windSpeed * (Math.random() * 0.5 + 0.75),
      speedY: Math.sin(angleRad) * this.windSpeed * (Math.random() * 0.5 + 0.75),
      color: 'rgba(57, 255, 20, 0.8)',
      lifetime: Infinity, // Particles now live forever
      trail: [],
      hasCollided: false,
      collisionTimer: 0,
      power: this.windSpeed
    };
  }

  private updateParticle(particle: WindParticle) {
    const now = performance.now();
    const deltaTime = (now - this.lastTime) / 16;
    
    // Apply wind force with improved physics
    const angleRad = (this.windAngle * Math.PI) / 180;
    const baseSpeed = this.windSpeed * (0.8 + Math.random() * 0.4);
    
    // Enhanced turbulence and natural variation
    const turbulence = Math.sin(now * 0.001 + particle.x * 0.1) * 0.5;
    const curveEffect = Math.sin(particle.x * 0.01 + particle.y * 0.01) * this.windCurve;
    
    // Calculate final angle with improved dynamics
    const finalAngle = angleRad + curveEffect + turbulence * 0.1;
    
    // Target speeds with natural movement
    const targetSpeedX = Math.cos(finalAngle) * baseSpeed * (1 + Math.random() * 0.2);
    const targetSpeedY = Math.sin(finalAngle) * baseSpeed * (1 + Math.random() * 0.2);
    
    // Smooth velocity transitions
    const lerpFactor = 0.1 * deltaTime;
    particle.speedX += (targetSpeedX - particle.speedX) * lerpFactor;
    particle.speedY += (targetSpeedY - particle.speedY) * lerpFactor;

    // Apply velocity with deltaTime scaling
    particle.x += particle.speedX * deltaTime;
    particle.y += particle.speedY * deltaTime;

    // Wrap around screen edges instead of resetting
    if (particle.x < 0) particle.x = this.canvasWidth;
    if (particle.x > this.canvasWidth) particle.x = 0;
    if (particle.y < 0) particle.y = this.canvasHeight;
    if (particle.y > this.canvasHeight) particle.y = 0;

    // Update trail
    if (particle.trail) {
      particle.trail.unshift({ x: particle.x, y: particle.y });
      if (particle.trail.length > 10) particle.trail.pop();
    }

    // Calculate and update energy
    const energy = 0.5 * particle.power! * (particle.speedX ** 2 + particle.speedY ** 2);
    this.energyCalculator.addEnergyReading(energy);

    return particle;
  }

  public update() {
    const now = performance.now();
    
    // Update particles
    this.particles.forEach(particle => {
      this.updateParticle(particle);
    });

    // Draw particles with improved trails
    this.particles.forEach(particle => {
      // Draw trail with fade effect
      if (particle.trail && particle.trail.length > 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
        
        particle.trail.forEach((point, index) => {
          const alpha = 1 - (index / particle.trail.length);
          this.ctx.strokeStyle = `rgba(57, 255, 20, ${alpha * 0.3})`;
          this.ctx.lineTo(point.x, point.y);
        });
        
        this.ctx.lineWidth = particle.size / 2;
        this.ctx.stroke();
      }

      // Draw particle with glow effect
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.shadowColor = 'rgba(57, 255, 20, 0.5)';
      this.ctx.shadowBlur = 5;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });

    this.lastTime = now;
  }

  public getCollisionEnergy(): number {
    return this.energyCalculator.getAverageEnergy();
  }
}
