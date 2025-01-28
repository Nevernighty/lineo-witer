import { WindParticle, Obstacle, EnergyMarker } from "./types";

export class ParticleSystem {
  private particles: WindParticle[] = [];
  private trails: { points: { x: number; y: number }[]; lifetime: number }[] = [];
  private energyMarkers: EnergyMarker[] = [];
  private lastTime: number = performance.now();
  private readonly MAX_PARTICLES = 150; // Reduced from previous value
  
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
      const angleRad = (this.windAngle * Math.PI) / 180;
      this.particles.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        size: Math.random() * 2 + 1,
        speedX: Math.cos(angleRad) * this.windSpeed * (Math.random() * 0.5 + 0.75),
        speedY: Math.sin(angleRad) * this.windSpeed * (Math.random() * 0.5 + 0.75),
        color: 'rgba(57, 255, 20, 0.8)',
        lifetime: 300,
        trail: [],
        hasCollided: false,
        collisionTimer: 0,
        power: this.windSpeed
      });
    }

    // Remove excess particles if density is lowered
    if (this.particles.length > particleCount) {
      this.particles.length = particleCount;
    }
  }

  private updateParticle(particle: WindParticle) {
    const now = performance.now();
    const deltaTime = (now - this.lastTime) / 16; // Normalize to ~60fps
    
    // Apply wind force with improved physics
    const angleRad = (this.windAngle * Math.PI) / 180;
    const baseSpeed = this.windSpeed * (0.8 + Math.random() * 0.4);
    
    // Add natural variation and turbulence
    const turbulence = Math.sin(now * 0.001 + particle.x * 0.1) * 0.5;
    const curveEffect = Math.sin(particle.x * 0.01 + particle.y * 0.01) * this.windCurve;
    
    // Calculate final angle with dynamics
    const finalAngle = angleRad + curveEffect + turbulence * 0.1;
    
    // Update velocities with smooth transitions
    const targetSpeedX = Math.cos(finalAngle) * baseSpeed;
    const targetSpeedY = Math.sin(finalAngle) * baseSpeed;
    
    const lerpFactor = 0.1 * deltaTime;
    particle.speedX += (targetSpeedX - particle.speedX) * lerpFactor;
    particle.speedY += (targetSpeedY - particle.speedY) * lerpFactor;

    // Apply velocity
    particle.x += particle.speedX * deltaTime;
    particle.y += particle.speedY * deltaTime;

    // Handle borders
    if (particle.x < 0) particle.x = this.canvasWidth;
    if (particle.x > this.canvasWidth) particle.x = 0;
    if (particle.y < 0) particle.y = this.canvasHeight;
    if (particle.y > this.canvasHeight) particle.y = 0;

    // Update trail
    if (particle.trail) {
      particle.trail.unshift({ x: particle.x, y: particle.y });
      if (particle.trail.length > 10) particle.trail.pop();
    }

    // Update lifetime
    particle.lifetime--;
    if (particle.lifetime <= 0) {
      this.resetParticle(particle);
    }

    return particle;
  }

  private resetParticle(particle: WindParticle) {
    const angleRad = this.windAngle * Math.PI / 180;
    particle.x = Math.random() * this.canvasWidth;
    particle.y = Math.random() * this.canvasHeight;
    particle.speedX = Math.cos(angleRad) * this.windSpeed * (Math.random() + 0.5);
    particle.speedY = Math.sin(angleRad) * this.windSpeed * (Math.random() + 0.5);
    particle.lifetime = 300;
    particle.trail = [];
    particle.hasCollided = false;
    particle.collisionTimer = 0;
  }

  public update() {
    const now = performance.now();
    
    // Update particles
    this.particles.forEach(particle => {
      this.updateParticle(particle);
    });

    // Draw particles
    this.particles.forEach(particle => {
      // Draw trail
      if (particle.trail && particle.trail.length > 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
        
        for (let i = 1; i < particle.trail.length; i++) {
          this.ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
        }
        
        this.ctx.strokeStyle = `rgba(57, 255, 20, ${0.3 * (particle.trail.length / 10)})`;
        this.ctx.lineWidth = particle.size / 2;
        this.ctx.stroke();
      }

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.fill();
    });

    this.lastTime = now;
  }

  public getCollisionEnergy(): number {
    return this.particles.reduce((total, particle) => {
      return total + (0.5 * particle.power! * (particle.speedX ** 2 + particle.speedY ** 2));
    }, 0);
  }
}