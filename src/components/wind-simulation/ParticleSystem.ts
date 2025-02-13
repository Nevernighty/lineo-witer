import { WindParticle, Obstacle, EnergyMarker } from "./types";
import { EnergyCalculator } from "./EnergyCalculator";

export class ParticleSystem {
  private particles: WindParticle[] = [];
  private trails: { points: { x: number; y: number }[]; lifetime: number }[] = [];
  private energyMarkers: EnergyMarker[] = [];
  private lastTime: number = performance.now();
  private readonly MAX_PARTICLES = 150;
  private energyCalculator: EnergyCalculator;
  private windBlasts: Array<{ x: number; y: number; power: number; lifetime: number }> = [];
  private animationFrame: number | null = null;
  
  constructor(
    private ctx: CanvasRenderingContext2D,
    private canvasWidth: number,
    private canvasHeight: number,
    public windSpeed: number,
    public windAngle: number,
    public windCurve: number,
    public particleDensity: number,
    private obstacles: Obstacle[]
  ) {
    this.energyCalculator = new EnergyCalculator();
    this.createParticles();
    this.startAnimation();
  }

  public updateSettings(windSpeed: number, windAngle: number, windCurve: number, particleDensity: number) {
    this.windSpeed = windSpeed;
    this.windAngle = windAngle;
    this.windCurve = windCurve;
    this.particleDensity = particleDensity;
    this.createParticles(); // Recreate particles with new settings
  }

  private startAnimation() {
    const animate = () => {
      this.update();
      this.animationFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  public cleanup() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  public updateDimensions(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.createParticles();
  }

  public addWindTrail(x: number, y: number, angle: number, power: number) {
    this.windBlasts.push({
      x,
      y,
      power: power * 2,
      lifetime: 60
    });
  }

  private createParticles() {
    const particleCount = Math.min(
      Math.floor(this.particleDensity * (this.canvasWidth * this.canvasHeight) / 100000),
      this.MAX_PARTICLES
    );
    
    this.particles = Array.from({ length: particleCount }, () => this.createNewParticle());
  }

  private createNewParticle(x?: number, y?: number): WindParticle {
    const angleRad = (this.windAngle * Math.PI) / 180;
    const baseSpeed = Math.max(0.1, this.windSpeed * 0.5);
    return {
      x: x ?? Math.random() * this.canvasWidth,
      y: y ?? Math.random() * this.canvasHeight,
      size: Math.random() * 2 + 1,
      speedX: Math.cos(angleRad) * baseSpeed * (Math.random() * 0.5 + 0.75),
      speedY: Math.sin(angleRad) * baseSpeed * (Math.random() * 0.5 + 0.75),
      color: 'rgba(57, 255, 20, 0.8)',
      lifetime: Infinity,
      trail: [],
      hasCollided: false,
      collisionTimer: 0,
      power: this.windSpeed
    };
  }

  private updateParticle(particle: WindParticle, deltaTime: number) {
    const angleRad = (this.windAngle * Math.PI) / 180;
    const baseSpeed = Math.max(0.1, this.windSpeed * (0.8 + Math.random() * 0.4));
    
    const now = performance.now();
    const turbulence = Math.sin(now * 0.001 + particle.x * 0.1) * 0.5;
    const curveEffect = Math.sin(particle.x * 0.01 + particle.y * 0.01) * this.windCurve;
    
    const finalAngle = angleRad + curveEffect + turbulence * 0.1;
    
    // Apply base wind force
    let targetSpeedX = Math.cos(finalAngle) * baseSpeed;
    let targetSpeedY = Math.sin(finalAngle) * baseSpeed;
    
    // Apply wind blast effects
    this.windBlasts.forEach(blast => {
      const dx = particle.x - blast.x;
      const dy = particle.y - blast.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 200) {
        const influence = Math.max(0, 1 - distance / 200) * blast.power;
        targetSpeedX += (dx / distance || 0) * influence;
        targetSpeedY += (dy / distance || 0) * influence;
      }
    });
    
    // Update particle velocity with smooth transition
    const lerpFactor = 0.1 * (deltaTime / 16);
    particle.speedX += (targetSpeedX - particle.speedX) * lerpFactor;
    particle.speedY += (targetSpeedY - particle.speedY) * lerpFactor;

    // Apply minimum speed to ensure particles keep moving
    const minSpeed = 0.1;
    const currentSpeed = Math.sqrt(particle.speedX * particle.speedX + particle.speedY * particle.speedY);
    if (currentSpeed < minSpeed) {
      particle.speedX *= minSpeed / currentSpeed;
      particle.speedY *= minSpeed / currentSpeed;
    }

    // Update position
    particle.x += particle.speedX;
    particle.y += particle.speedY;

    // Wrap around screen edges
    if (particle.x < 0) particle.x = this.canvasWidth;
    if (particle.x > this.canvasWidth) particle.x = 0;
    if (particle.y < 0) particle.y = this.canvasHeight;
    if (particle.y > this.canvasHeight) particle.y = 0;

    // Update trail
    if (particle.trail) {
      particle.trail.unshift({ x: particle.x, y: particle.y });
      if (particle.trail.length > 10) particle.trail.pop();
    }

    // Calculate energy
    const energy = 0.5 * particle.power! * (particle.speedX ** 2 + particle.speedY ** 2);
    this.energyCalculator.addEnergyReading(energy);
  }

  public update() {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    
    // Clear canvas with fade effect
    this.ctx.fillStyle = 'rgba(26, 31, 44, 0.2)';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Update wind blasts
    this.windBlasts = this.windBlasts.filter(blast => {
      blast.lifetime--;
      return blast.lifetime > 0;
    });
    
    // Update and draw particles
    this.particles.forEach(particle => {
      this.updateParticle(particle, deltaTime);
    });

    this.particles.forEach(particle => {
      // Draw trail
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

      // Draw particle
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
