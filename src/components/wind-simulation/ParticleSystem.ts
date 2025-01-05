import { WindParticle, Obstacle, WindTrail, EnergyMarker } from './types';
import { WindTrails } from './WindTrails';

export class ParticleSystem {
  private particles: WindParticle[] = [];
  private trails: WindTrail[] = [];
  private energyMarkers: EnergyMarker[] = [];
  private readonly PARTICLE_LIFETIME = 300;
  private readonly TRAIL_LENGTH = 30;
  private readonly COLLISION_COLOR = 'rgba(255, 182, 193, 0.9)';
  private readonly DEFAULT_COLOR = 'rgba(57, 255, 20, 0.8)';
  private windTrails: WindTrails;
  private lastTime: number = 0;
  private readonly SPAWN_INTERVAL = 16;
  private turbulenceOffset: number = 0;

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
    this.windTrails = new WindTrails(ctx, canvasWidth, canvasHeight);
    this.lastTime = performance.now();
    this.turbulenceOffset = Math.random() * 1000;
  }

  public updateDimensions(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.windTrails.updateDimensions(width, height);
  }

  public addWindTrail(x: number, y: number, angle: number, power: number) {
    this.windTrails.addWindTrail(x, y, angle, power);
  }

  private createParticles() {
    const angleRad = (this.windAngle * Math.PI) / 180;
    
    for (let i = 0; i < this.particleDensity; i++) {
      this.particles.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        size: Math.random() * 2 + 1,
        speedX: Math.cos(angleRad) * this.windSpeed * (Math.random() + 0.5),
        speedY: Math.sin(angleRad) * this.windSpeed * (Math.random() + 0.5),
        color: this.DEFAULT_COLOR,
        lifetime: this.PARTICLE_LIFETIME,
        trail: [],
        hasCollided: false,
        collisionTimer: 0,
        power: this.windSpeed * Math.random()
      });
    }
  }

  private initializeEnergyMarkers() {
    this.energyMarkers = [
      { position: 'left', inflow: 0, outflow: 0 },
      { position: 'right', inflow: 0, outflow: 0 },
      { position: 'top', inflow: 0, outflow: 0 },
      { position: 'bottom', inflow: 0, outflow: 0 }
    ];
  }

  private updateParticle(particle: WindParticle, deltaTime: number) {
    // Apply wind force with proper angle and speed
    const angleRad = (this.windAngle * Math.PI) / 180;
    const windForce = this.windSpeed * 0.1 * (deltaTime / 16);
    
    // Add natural variation and curved path based on windCurve
    const curveEffect = Math.sin(particle.x * 0.01 + particle.y * 0.01) * this.windCurve;
    const turbulence = Math.sin((performance.now() + this.turbulenceOffset) * 0.001) * 0.2;
    
    // Update particle velocity with proper physics
    particle.speedX = Math.cos(angleRad + curveEffect) * windForce + turbulence;
    particle.speedY = Math.sin(angleRad + curveEffect) * windForce + turbulence;

    // Apply particle density effect
    const densityFactor = this.particleDensity / 100;
    particle.speedX *= densityFactor;
    particle.speedY *= densityFactor;

    // Update position
    particle.x += particle.speedX;
    particle.y += particle.speedY;

    // Handle obstacle collisions with improved physics
    this.handleObstacleCollisions(particle);

    // Update trail
    if (particle.trail) {
      particle.trail.unshift({ x: particle.x, y: particle.y });
      if (particle.trail.length > this.TRAIL_LENGTH) {
        particle.trail.pop();
      }
    }

    // Check borders and update energy markers
    this.handleBorderCollision(particle);

    // Update lifetime
    particle.lifetime--;
    if (particle.lifetime <= 0) {
      this.resetParticle(particle);
    }
  }

  private handleObstacleCollisions(particle: WindParticle) {
    for (const obstacle of this.obstacles) {
      if (
        particle.x >= obstacle.x &&
        particle.x <= obstacle.x + obstacle.width &&
        particle.y >= obstacle.y &&
        particle.y <= obstacle.y + obstacle.height
      ) {
        if (!particle.hasCollided) {
          particle.hasCollided = true;
          particle.collisionTimer = 30;
          particle.color = this.COLLISION_COLOR;

          // Calculate reflection vectors
          const centerX = obstacle.x + obstacle.width / 2;
          const centerY = obstacle.y + obstacle.height / 2;
          const normalX = (particle.x - centerX) / (obstacle.width / 2);
          const normalY = (particle.y - centerY) / (obstacle.height / 2);
          const normalLength = Math.sqrt(normalX * normalX + normalY * normalY);

          // Normalize and apply reflection
          const nx = normalX / normalLength;
          const ny = normalY / normalLength;
          const dotProduct = particle.speedX * nx + particle.speedY * ny;

          particle.speedX = particle.speedX - 2 * dotProduct * nx;
          particle.speedY = particle.speedY - 2 * dotProduct * ny;

          // Add energy loss
          particle.speedX *= 0.8;
          particle.speedY *= 0.8;
        }
      }
    }

    // Reset collision state after timer expires
    if (particle.collisionTimer > 0) {
      particle.collisionTimer--;
      if (particle.collisionTimer === 0) {
        particle.hasCollided = false;
        particle.color = this.DEFAULT_COLOR;
      }
    }
  }

  private handleBorderCollision(particle: WindParticle) {
    const buffer = 5;
    const energy = 0.5 * particle.power! * (particle.speedX ** 2 + particle.speedY ** 2);

    // Create glowing effect for energy markers
    const createGlow = (x: number, y: number, value: number) => {
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = 'rgba(57, 255, 20, 0.8)';
      this.ctx.fillStyle = `rgba(57, 255, 20, ${Math.min(value / 10, 0.8)})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    };

    if (particle.x < buffer) {
      this.energyMarkers[0].outflow += energy;
      createGlow(0, particle.y, energy);
      particle.x = this.canvasWidth - buffer;
    } else if (particle.x > this.canvasWidth - buffer) {
      this.energyMarkers[1].outflow += energy;
      createGlow(this.canvasWidth, particle.y, energy);
      particle.x = buffer;
    }

    if (particle.y < buffer) {
      this.energyMarkers[2].outflow += energy;
      createGlow(particle.x, 0, energy);
      particle.y = this.canvasHeight - buffer;
    } else if (particle.y > this.canvasHeight - buffer) {
      this.energyMarkers[3].outflow += energy;
      createGlow(particle.x, this.canvasHeight, energy);
      particle.y = buffer;
    }
  }

  private resetParticle(particle: WindParticle) {
    const angleRad = (this.windAngle * Math.PI) / 180;
    particle.x = Math.random() * this.canvasWidth;
    particle.y = Math.random() * this.canvasHeight;
    particle.speedX = Math.cos(angleRad) * this.windSpeed * (Math.random() + 0.5);
    particle.speedY = Math.sin(angleRad) * this.windSpeed * (Math.random() + 0.5);
    particle.lifetime = this.PARTICLE_LIFETIME;
    particle.trail = [];
    particle.hasCollided = false;
    particle.collisionTimer = 0;
    particle.color = this.DEFAULT_COLOR;
  }

  public update() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Reset energy measurements
    this.energyMarkers.forEach(marker => {
      marker.inflow = 0;
      marker.outflow = 0;
    });

    // Update wind trails
    this.windTrails.update();

    // Update and draw particles with time-based movement
    this.particles.forEach(particle => {
      this.updateParticle(particle, deltaTime);
      this.drawParticle(particle);
    });

    // Draw wind trails
    this.windTrails.draw();

    // Draw energy markers
    this.drawEnergyMarkers();
  }

  private drawParticle(particle: WindParticle) {
    // Draw trail with smooth gradient
    if (particle.trail && particle.trail.length > 1) {
      this.ctx.beginPath();
      this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
      
      for (let i = 1; i < particle.trail.length - 1; i++) {
        const xc = (particle.trail[i].x + particle.trail[i + 1].x) / 2;
        const yc = (particle.trail[i].y + particle.trail[i + 1].y) / 2;
        this.ctx.quadraticCurveTo(
          particle.trail[i].x,
          particle.trail[i].y,
          xc,
          yc
        );
      }
      
      this.ctx.strokeStyle = `rgba(${particle.hasCollided ? '255, 182, 193' : '57, 255, 20'}, ${0.3 * (particle.trail.length / this.TRAIL_LENGTH)})`;
      this.ctx.lineWidth = particle.size / 2;
      this.ctx.stroke();
    }

    // Draw particle with glow effect
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = particle.color;
    this.ctx.fillStyle = particle.color;
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  private drawEnergyMarkers() {
    this.energyMarkers.forEach(marker => {
      const x = marker.position === 'left' ? 10 : 
               marker.position === 'right' ? this.canvasWidth - 100 : 
               this.canvasWidth / 2 - 50;
      
      const y = marker.position === 'top' ? 20 : 
               marker.position === 'bottom' ? this.canvasHeight - 40 : 
               this.canvasHeight / 2;

      // Draw with glow effect
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = 'rgba(57, 255, 20, 0.8)';
      this.ctx.fillStyle = 'rgba(57, 255, 20, 0.8)';
      this.ctx.font = '12px monospace';
      this.ctx.fillText(`In: ${(marker.inflow * this.windSpeed).toFixed(1)}W`, x, y);
      this.ctx.fillText(`Out: ${(marker.outflow * this.windSpeed).toFixed(1)}W`, x, y + 15);
      this.ctx.shadowBlur = 0;
    });
  }
}