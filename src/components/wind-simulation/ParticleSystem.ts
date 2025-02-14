import { WindParticle, Obstacle, EnergyMarker } from "./types";
import { EnergyCalculator } from "./EnergyCalculator";

export class ParticleSystem {
  private particles: WindParticle[] = [];
  private trails: { points: { x: number; y: number; z?: number }[]; lifetime: number }[] = [];
  private energyMarkers: EnergyMarker[] = [];
  private lastTime: number = performance.now();
  private readonly MAX_PARTICLES = 5000; // Increased max particles for Turbo mode
  private energyCalculator: EnergyCalculator;
  private windBlasts: Array<{ x: number; y: number; z: number; power: number; lifetime: number }> = [];
  private animationFrame: number | null = null;
  private collisionEnergy: number = 0;
  private is3D: boolean = false;
  private zDepth: number = 0;
  
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

  private createParticles() {
    // Calculate actual number of particles based on density
    const targetParticleCount = Math.floor(this.particleDensity);
    
    // Remove excess particles if needed
    while (this.particles.length > targetParticleCount) {
      this.particles.pop();
    }
    
    // Add new particles if needed
    while (this.particles.length < targetParticleCount) {
      this.particles.push(this.createNewParticle());
    }
  }

  private checkCollision(particle: WindParticle): boolean {
    for (const obstacle of this.obstacles) {
      // Enhanced collision detection with 3D support
      const isColliding = this.is3D 
        ? this.check3DCollision(particle, obstacle)
        : this.check2DCollision(particle, obstacle);

      if (isColliding) {
        // Calculate collision energy based on particle velocity
        const speed = Math.sqrt(
          particle.speedX ** 2 + 
          particle.speedY ** 2 + 
          (this.is3D ? particle.speedZ ** 2 : 0)
        );
        
        const collisionEnergy = 0.5 * particle.power! * speed ** 2;
        particle.collisionEnergy = collisionEnergy;
        this.collisionEnergy += collisionEnergy;

        // Update particle appearance and behavior
        particle.color = 'rgba(255, 100, 20, 0.8)';
        particle.hasCollided = true;
        particle.collisionTimer = 20;

        // Apply collision response
        this.handleCollisionResponse(particle, obstacle);
        return true;
      }
    }
    return false;
  }

  private check3DCollision(particle: WindParticle, obstacle: Obstacle): boolean {
    return (
      particle.x >= obstacle.x &&
      particle.x <= obstacle.x + obstacle.width &&
      particle.y >= obstacle.y &&
      particle.y <= obstacle.y + obstacle.height &&
      particle.z >= obstacle.z &&
      particle.z <= obstacle.z + obstacle.depth
    );
  }

  private check2DCollision(particle: WindParticle, obstacle: Obstacle): boolean {
    return (
      particle.x >= obstacle.x &&
      particle.x <= obstacle.x + obstacle.width &&
      particle.y >= obstacle.y &&
      particle.y <= obstacle.y + obstacle.height
    );
  }

  private handleCollisionResponse(particle: WindParticle, obstacle: Obstacle) {
    // Calculate reflection vectors
    const nx = particle.x < obstacle.x + obstacle.width / 2 ? -1 : 1;
    const ny = particle.y < obstacle.y + obstacle.height / 2 ? -1 : 1;
    const nz = this.is3D ? (particle.z < obstacle.z + obstacle.depth / 2 ? -1 : 1) : 0;

    // Apply reflection with energy loss
    const dampening = 0.7;
    particle.speedX *= -nx * dampening;
    particle.speedY *= -ny * dampening;
    if (this.is3D) {
      particle.speedZ *= -nz * dampening;
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

  private updateParticle(particle: WindParticle, deltaTime: number) {
    if (particle.collisionTimer > 0) {
      particle.collisionTimer--;
      if (particle.collisionTimer === 0) {
        particle.hasCollided = false;
        particle.color = 'rgba(57, 255, 20, 0.8)';
      }
    }

    // Update particle position based on wind speed and angle
    const angleRad = (this.windAngle * Math.PI) / 180;
    const baseSpeed = this.windSpeed * (0.8 + Math.random() * 0.4);
    
    const turbulence = Math.sin(Date.now() * 0.001 + particle.x * 0.1) * 0.5;
    const curveEffect = Math.sin(particle.x * 0.01 + particle.y * 0.01) * this.windCurve;
    
    const finalAngle = angleRad + curveEffect + turbulence * 0.1;
    
    particle.speedX += (Math.cos(finalAngle) * baseSpeed - particle.speedX) * 0.1;
    particle.speedY += (Math.sin(finalAngle) * baseSpeed - particle.speedY) * 0.1;
    
    if (this.is3D) {
      particle.speedZ += (Math.sin(finalAngle * 0.5) * baseSpeed - particle.speedZ) * 0.1;
    }

    particle.x += particle.speedX * (deltaTime / 16);
    particle.y += particle.speedY * (deltaTime / 16);
    if (this.is3D) {
      particle.z += particle.speedZ * (deltaTime / 16);
    }

    this.checkCollision(particle);

    // Handle boundaries
    this.handleBoundaries(particle);

    // Update trail
    if (particle.trail) {
      particle.trail.unshift({ 
        x: particle.x, 
        y: particle.y, 
        z: this.is3D ? particle.z : 0 
      });
      if (particle.trail.length > 10) particle.trail.pop();
    }
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

    if (this.is3D && particle.z) {
      if (particle.z < -buffer) {
        particle.z = this.zDepth + buffer;
      } else if (particle.z > this.zDepth + buffer) {
        particle.z = -buffer;
      }
    }
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

  public addWindTrail(x: number, y: number, z: number, angle: number, power: number) {
    this.windBlasts.push({
      x,
      y,
      z,
      power: power * 2,
      lifetime: 60
    });
  }

  public addWindWhirl(x: number, y: number, z: number) {
    const particleCount = 12;
    const radius = 20;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const particleX = x + Math.cos(angle) * radius;
      const particleY = y + Math.sin(angle) * radius;
      const particleZ = z + Math.cos(angle) * radius;
      
      const particle = this.createNewParticle(particleX, particleY, particleZ);
      particle.speedX = Math.cos(angle) * this.windSpeed * 2;
      particle.speedY = Math.sin(angle) * this.windSpeed * 2;
      particle.speedZ = Math.sin(angle) * this.windSpeed * 2;
      particle.lifetime = 200;
      this.particles.push(particle);
    }

    this.windBlasts.push({
      x,
      y,
      z,
      power: this.windSpeed * 3,
      lifetime: 120
    });
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

    // Draw particles and trails
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

    // Draw statistics with background
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
