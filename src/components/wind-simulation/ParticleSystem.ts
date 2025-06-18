import { WindParticle, Obstacle, EnergyMarker } from "./types";
import { EnergyCalculator } from "./EnergyCalculator";

export class ParticleSystem {
  private particles: WindParticle[] = [];
  private trails: { points: { x: number; y: number; z?: number }[]; lifetime: number }[] = [];
  private energyMarkers: EnergyMarker[] = [];
  private lastTime: number = performance.now();
  private readonly MAX_PARTICLES = 5000;
  private energyCalculator: EnergyCalculator;
  private windBlasts: Array<{ x: number; y: number; z: number; power: number; lifetime: number }> = [];
  private animationFrame: number | null = null;
  private collisionEnergy: number = 0;
  private is3D: boolean = false;
  private zDepth: number = 10;
  
  constructor(
    private ctx: CanvasRenderingContext2D,
    private canvasWidth: number,
    private canvasHeight: number,
    public windSpeed: number,
    public windAngle: number,
    public windCurve: number,
    public particleDensity: number,
    private obstacles: Obstacle[],
    is3D: boolean = false
  ) {
    this.energyCalculator = new EnergyCalculator();
    this.is3D = is3D;
    this.createParticles();
  }

  private createParticles() {
    const targetParticleCount = Math.floor(this.particleDensity);
    
    while (this.particles.length > targetParticleCount) {
      this.particles.pop();
    }
    
    while (this.particles.length < targetParticleCount) {
      this.particles.push(this.createNewParticle());
    }
  }

  private createNewParticle(x?: number, y?: number, z?: number): WindParticle {
    const angleRad = (this.windAngle * Math.PI) / 180;
    const baseSpeed = Math.max(0.1, this.windSpeed * 0.5);
    return {
      x: x ?? Math.random() * this.canvasWidth,
      y: y ?? Math.random() * this.canvasHeight,
      z: z ?? (this.is3D ? Math.random() * this.zDepth : 0),
      size: Math.random() * 2 + 1,
      speedX: Math.cos(angleRad) * baseSpeed * (Math.random() * 0.5 + 0.75),
      speedY: Math.sin(angleRad) * baseSpeed * (Math.random() * 0.5 + 0.75),
      speedZ: this.is3D ? Math.sin(angleRad * 0.5) * baseSpeed * (Math.random() * 0.5 + 0.75) : 0,
      color: 'rgba(57, 255, 20, 0.8)',
      lifetime: Infinity,
      trail: [],
      hasCollided: false,
      collisionTimer: 0,
      power: this.windSpeed,
      collisionEnergy: 0
    };
  }

  private check3DCollision(particle: WindParticle, obstacle: Obstacle): boolean {
    const particlePos = {
      x: particle.x,
      y: particle.y,
      z: particle.z || 0
    };
    
    const obstacleMin = {
      x: obstacle.x,
      y: obstacle.y,
      z: obstacle.z || 0
    };
    
    const obstacleMax = {
      x: obstacle.x + obstacle.width,
      y: obstacle.y + obstacle.height,
      z: obstacle.z + (obstacle.depth || 1)
    };
    
    return (
      particlePos.x >= obstacleMin.x && particlePos.x <= obstacleMax.x &&
      particlePos.y >= obstacleMin.y && particlePos.y <= obstacleMax.y &&
      particlePos.z >= obstacleMin.z && particlePos.z <= obstacleMax.z
    );
  }

  private handleCollisionResponse(particle: WindParticle, obstacle: Obstacle) {
    // Calculate reflection vectors based on which side was hit
    const nx = particle.x < obstacle.x + obstacle.width / 2 ? -1 : 1;
    const ny = particle.y < obstacle.y + obstacle.height / 2 ? -1 : 1;
    const nz = this.is3D ? (particle.z < (obstacle.z || 0) + (obstacle.depth || 1) / 2 ? -1 : 1) : 0;

    // Apply reflection with energy loss
    const dampening = 0.7;
    particle.speedX *= -nx * dampening;
    particle.speedY *= -ny * dampening;
    if (this.is3D) {
      particle.speedZ *= -nz * dampening;
    }
  }

  private updateParticle(particle: WindParticle, deltaTime: number) {
    if (particle.collisionTimer > 0) {
      particle.collisionTimer--;
      if (particle.collisionTimer === 0) {
        particle.hasCollided = false;
        particle.color = 'rgba(57, 255, 20, 0.8)';
      }
    }

    const angleRad = (this.windAngle * Math.PI) / 180;
    const baseSpeed = this.windSpeed * (0.8 + Math.random() * 0.4);
    
    const turbulence = Math.sin(Date.now() * 0.001 + particle.x * 0.1) * 0.5;
    const curveEffect = Math.sin(particle.x * 0.01 + particle.y * 0.01) * this.windCurve;
    
    const finalAngle = angleRad + curveEffect + turbulence * 0.1;
    
    // Update speeds with 3D support
    particle.speedX += (Math.cos(finalAngle) * baseSpeed - particle.speedX) * 0.1;
    particle.speedY += (Math.sin(finalAngle) * baseSpeed - particle.speedY) * 0.1;
    if (this.is3D) {
      particle.speedZ += (Math.sin(finalAngle * 0.5) * baseSpeed - particle.speedZ) * 0.1;
    }

    // Update positions
    particle.x += particle.speedX * (deltaTime / 16);
    particle.y += particle.speedY * (deltaTime / 16);
    if (this.is3D) {
      particle.z += (particle.speedZ || 0) * (deltaTime / 16);
    }

    // Check for collisions
    for (const obstacle of this.obstacles) {
      if (this.is3D ? this.check3DCollision(particle, obstacle) : this.check2DCollision(particle, obstacle)) {
        const speed = Math.sqrt(
          particle.speedX ** 2 + 
          particle.speedY ** 2 + 
          (this.is3D ? (particle.speedZ || 0) ** 2 : 0)
        );
        
        const collisionEnergy = 0.5 * particle.power! * speed ** 2;
        particle.collisionEnergy = collisionEnergy;
        this.collisionEnergy += collisionEnergy;

        particle.color = 'rgba(255, 100, 20, 0.8)';
        particle.hasCollided = true;
        particle.collisionTimer = 20;

        this.handleCollisionResponse(particle, obstacle);
        break;
      }
    }

    // Handle boundaries
    this.handleBoundaries(particle);

    // Update trail with improved trail system
    if (particle.trail) {
      particle.trail.unshift({ x: particle.x, y: particle.y, z: particle.z });
      if (particle.trail.length > 15) particle.trail.pop();
    }
  }

  private check2DCollision(particle: WindParticle, obstacle: Obstacle): boolean {
    return (
      particle.x >= obstacle.x &&
      particle.x <= obstacle.x + obstacle.width &&
      particle.y >= obstacle.y &&
      particle.y <= obstacle.y + obstacle.height
    );
  }

  private handleBoundaries(particle: WindParticle) {
    const buffer = 5;
    if (particle.x < -buffer) {
      particle.x = this.canvasWidth + buffer;
    } else if (particle.x > this.canvasWidth + buffer) {
      particle.x = -buffer;
    }
    
    if (particle.y < -buffer) {
      particle.y = this.canvasHeight + buffer;
    } else if (particle.y > this.canvasHeight + buffer) {
      particle.y = -buffer;
    }

    if (this.is3D && typeof particle.z !== 'undefined') {
      if (particle.z < -buffer) {
        particle.z = this.zDepth + buffer;
      } else if (particle.z > this.zDepth + buffer) {
        particle.z = -buffer;
      }
    }
  }

  public updateSettings(
    windSpeed: number,
    windAngle: number,
    windCurve: number,
    particleDensity: number,
    is3D: boolean = false
  ) {
    this.windSpeed = windSpeed;
    this.windAngle = windAngle;
    this.windCurve = windCurve;
    this.particleDensity = particleDensity;
    this.is3D = is3D;
    this.createParticles();
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

  public addWindTrail(x: number, y: number, z: number, angle: number, power: number) {
    this.windBlasts.push({
      x,
      y,
      z,
      power: power * 2,
      lifetime: 60
    });
    
    // Create a burst of particles at the click location
    for (let i = 0; i < 10; i++) {
      const angleRad = (angle + (Math.random() - 0.5) * 60) * Math.PI / 180;
      const speed = power * (0.5 + Math.random() * 0.5);
      const particle = this.createNewParticle(x, y, z);
      particle.speedX = Math.cos(angleRad) * speed;
      particle.speedY = Math.sin(angleRad) * speed;
      particle.lifetime = 100;
      this.particles.push(particle);
    }
  }

  public update() {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    
    // Reset collision energy
    this.collisionEnergy = 0;
    
    // Clear canvas with fade effect
    this.ctx.fillStyle = 'rgba(26, 31, 44, 0.2)';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Update wind blasts
    this.windBlasts = this.windBlasts.filter(blast => {
      blast.lifetime--;
      return blast.lifetime > 0;
    });
    
    // Update particles
    this.particles = this.particles.filter(p => p.lifetime === Infinity || p.lifetime > 0);
    
    this.particles.forEach(particle => {
      if (particle.lifetime !== Infinity) {
        particle.lifetime--;
      }
      this.updateParticle(particle, deltaTime);
    });

    // Draw particles and trails with improved rendering
    this.particles.forEach(particle => {
      // Draw trail first
      if (particle.trail && particle.trail.length > 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
        
        for (let i = 1; i < particle.trail.length; i++) {
          const alpha = (1 - (i / particle.trail.length)) * 0.5;
          this.ctx.strokeStyle = particle.hasCollided 
            ? `rgba(255, 100, 20, ${alpha})` 
            : `rgba(57, 255, 20, ${alpha})`;
          this.ctx.lineWidth = particle.size * 0.5;
          this.ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
          this.ctx.stroke();
          this.ctx.beginPath();
          this.ctx.moveTo(particle.trail[i].x, particle.trail[i].y);
        }
      }

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.hasCollided 
        ? 'rgba(255, 100, 20, 0.9)' 
        : particle.color;
      this.ctx.shadowColor = particle.hasCollided 
        ? 'rgba(255, 100, 20, 0.5)'
        : 'rgba(57, 255, 20, 0.5)';
      this.ctx.shadowBlur = particle.hasCollided ? 8 : 5;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });

    // Draw statistics
    this.drawStatistics();

    this.lastTime = now;
  }

  private drawStatistics() {
    // Create semi-transparent dark background for stats
    this.ctx.fillStyle = 'rgba(26, 31, 44, 0.97)';
    this.ctx.fillRect(10, 10, 250, 120);
    
    // Draw statistics with improved styling
    this.ctx.fillStyle = 'rgba(57, 255, 20, 0.8)';
    this.ctx.font = '14px monospace';
    
    const stats = [
      `Collision Energy: ${this.collisionEnergy.toFixed(2)} J`,
      `Wind Speed: ${this.windSpeed.toFixed(1)} m/s`,
      `Wind Angle: ${this.windAngle.toFixed(0)}°`,
      `Wind Curve: ${this.windCurve.toFixed(2)}`,
      `Particles: ${this.particles.length}`
    ];
    
    stats.forEach((stat, index) => {
      this.ctx.fillText(stat, 20, 35 + (index * 20));
    });
  }

  public getCollisionEnergy(): number {
    return this.collisionEnergy;
  }

  public set3DMode(enabled: boolean) {
    this.is3D = enabled;
    if (enabled) {
      this.particles.forEach(particle => {
        particle.z = particle.z || 0;
        particle.speedZ = particle.speedZ || 0;
      });
    }
  }
}
