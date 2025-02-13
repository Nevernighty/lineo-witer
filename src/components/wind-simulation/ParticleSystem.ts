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
  private collisionEnergy: number = 0;
  
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

  public addWindWhirl(x: number, y: number) {
    const particleCount = 12;
    const radius = 20;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const particleX = x + Math.cos(angle) * radius;
      const particleY = y + Math.sin(angle) * radius;
      
      const particle = this.createNewParticle(particleX, particleY);
      particle.speedX = Math.cos(angle) * this.windSpeed * 2;
      particle.speedY = Math.sin(angle) * this.windSpeed * 2;
      particle.lifetime = 200;
      this.particles.push(particle);
    }

    this.windBlasts.push({
      x,
      y,
      power: this.windSpeed * 3,
      lifetime: 120
    });
  }

  private createParticles() {
    const particleCount = Math.min(
      Math.floor(this.particleDensity * (this.canvasWidth * this.canvasHeight) / 100000),
      this.MAX_PARTICLES
    );
    
    this.particles = this.particles.filter(p => p.lifetime === Infinity);
    while (this.particles.length < particleCount) {
      this.particles.push(this.createNewParticle());
    }
    if (this.particles.length > particleCount) {
      this.particles = this.particles.slice(0, particleCount);
    }
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
      power: this.windSpeed,
      collisionEnergy: 0
    };
  }

  private checkCollision(particle: WindParticle): boolean {
    for (const obstacle of this.obstacles) {
      if (
        particle.x >= obstacle.x &&
        particle.x <= obstacle.x + obstacle.width &&
        particle.y >= obstacle.y &&
        particle.y <= obstacle.y + obstacle.height
      ) {
        const speed = Math.sqrt(particle.speedX ** 2 + particle.speedY ** 2);
        const collisionEnergy = 0.5 * particle.power! * speed ** 2;
        particle.collisionEnergy = collisionEnergy;
        this.collisionEnergy += collisionEnergy;

        if (particle.x - obstacle.x < 5) particle.speedX *= -0.8;
        if (obstacle.x + obstacle.width - particle.x < 5) particle.speedX *= -0.8;
        if (particle.y - obstacle.y < 5) particle.speedY *= -0.8;
        if (obstacle.y + obstacle.height - particle.y < 5) particle.speedY *= -0.8;

        particle.hasCollided = true;
        particle.collisionTimer = 20;
        return true;
      }
    }
    return false;
  }

  private updateParticle(particle: WindParticle, deltaTime: number) {
    if (particle.collisionTimer > 0) {
      particle.collisionTimer--;
      if (particle.collisionTimer === 0) {
        particle.hasCollided = false;
      }
    }

    const angleRad = (this.windAngle * Math.PI) / 180;
    const baseSpeed = Math.max(0.1, this.windSpeed * (0.8 + Math.random() * 0.4));
    
    const now = performance.now();
    const turbulence = Math.sin(now * 0.001 + particle.x * 0.1) * 0.5;
    const curveEffect = Math.sin(particle.x * 0.01 + particle.y * 0.01) * this.windCurve;
    
    const finalAngle = angleRad + curveEffect + turbulence * 0.1;
    
    let targetSpeedX = Math.cos(finalAngle) * baseSpeed;
    let targetSpeedY = Math.sin(finalAngle) * baseSpeed;
    
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

    const lerpFactor = 0.1 * (deltaTime / 16);
    particle.speedX += (targetSpeedX - particle.speedX) * lerpFactor;
    particle.speedY += (targetSpeedY - particle.speedY) * lerpFactor;

    const minSpeed = 0.1;
    const currentSpeed = Math.sqrt(particle.speedX * particle.speedX + particle.speedY * particle.speedY);
    if (currentSpeed < minSpeed) {
      particle.speedX *= minSpeed / currentSpeed;
      particle.speedY *= minSpeed / currentSpeed;
    }

    const nextX = particle.x + particle.speedX;
    const nextY = particle.y + particle.speedY;
    
    particle.x = nextX;
    particle.y = nextY;

    this.checkCollision(particle);

    if (particle.x < 0) particle.x = this.canvasWidth;
    if (particle.x > this.canvasWidth) particle.x = 0;
    if (particle.y < 0) particle.y = this.canvasHeight;
    if (particle.y > this.canvasHeight) particle.y = 0;

    if (particle.trail) {
      particle.trail.unshift({ x: particle.x, y: particle.y });
      if (particle.trail.length > 10) particle.trail.pop();
    }

    const energy = 0.5 * particle.power! * (particle.speedX ** 2 + particle.speedY ** 2);
    this.energyCalculator.addEnergyReading(energy);
  }

  public update() {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    
    this.collisionEnergy = 0;
    
    this.ctx.fillStyle = 'rgba(26, 31, 44, 0.2)';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    this.windBlasts = this.windBlasts.filter(blast => {
      blast.lifetime--;
      return blast.lifetime > 0;
    });
    
    this.particles = this.particles.filter(p => p.lifetime === Infinity || p.lifetime > 0);
    
    this.particles.forEach(particle => {
      if (particle.lifetime !== Infinity) {
        particle.lifetime--;
      }
      this.updateParticle(particle, deltaTime);
    });

    this.particles.forEach(particle => {
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

      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.hasCollided 
        ? 'rgba(255, 100, 20, 0.8)' 
        : particle.color;
      this.ctx.shadowColor = particle.hasCollided 
        ? 'rgba(255, 100, 20, 0.5)'
        : 'rgba(57, 255, 20, 0.5)';
      this.ctx.shadowBlur = 5;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });

    this.ctx.fillStyle = 'rgba(57, 255, 20, 0.8)';
    this.ctx.font = '14px monospace';
    this.ctx.fillText(`Collision Energy: ${this.collisionEnergy.toFixed(2)}`, 10, 20);

    this.lastTime = now;
  }

  public getCollisionEnergy(): number {
    return this.collisionEnergy;
  }
}
