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
    this.turbulenceOffset = Math.random() * 1000; // Random offset for varied turbulence
  }

  private updateParticle(particle: WindParticle, deltaTime: number) {
    // Apply smooth turbulence using Perlin noise-like approach
    const turbulence = Math.sin(
      (performance.now() + this.turbulenceOffset + particle.x * 0.1) * 0.001
    ) * 0.2;

    // Apply wind force with smooth acceleration
    const windForce = this.windSpeed * 0.1 * (deltaTime / 16);
    const angleRad = this.windAngle * Math.PI / 180;
    
    // Add natural variation and curved path
    const curveEffect = Math.sin(particle.x * 0.01 + particle.y * 0.01) * this.windCurve;
    
    particle.speedX += (
      Math.cos(angleRad + curveEffect) * windForce + 
      turbulence * Math.cos(angleRad + Math.PI/2)
    );
    particle.speedY += (
      Math.sin(angleRad + curveEffect) * windForce + 
      turbulence * Math.sin(angleRad + Math.PI/2)
    );

    // Apply drag force with smooth deceleration
    const drag = 0.02 * (deltaTime / 16);
    particle.speedX *= (1 - drag);
    particle.speedY *= (1 - drag);

    // Update position with delta time scaling
    particle.x += particle.speedX * (deltaTime / 16);
    particle.y += particle.speedY * (deltaTime / 16);

    // Handle obstacle collisions with improved physics
    this.handleObstacleCollisions(particle);

    // Update trail with smooth interpolation
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
    this.obstacles.forEach(obstacle => {
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
    });

    // Reset collision state after timer expires
    if (particle.collisionTimer > 0) {
      particle.collisionTimer--;
      if (particle.collisionTimer === 0) {
        particle.hasCollided = false;
        particle.color = this.DEFAULT_COLOR;
      }
    }
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
      
      // Use quadratic curves for smoother trails
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

    // Draw particle
    this.ctx.fillStyle = particle.color;
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawEnergyMarkers() {
    this.energyMarkers.forEach(marker => {
      const x = marker.position === 'left' ? 10 : 
               marker.position === 'right' ? this.canvasWidth - 100 : 
               this.canvasWidth / 2 - 50;
      
      const y = marker.position === 'top' ? 20 : 
               marker.position === 'bottom' ? this.canvasHeight - 40 : 
               this.canvasHeight / 2;

      this.ctx.fillStyle = 'rgba(57, 255, 20, 0.8)';
      this.ctx.font = '12px monospace';
      this.ctx.fillText(`In: ${marker.inflow.toFixed(1)}`, x, y);
      this.ctx.fillText(`Out: ${marker.outflow.toFixed(1)}`, x, y + 15);
    });
  }

  private handleBorderCollision(particle: WindParticle) {
    const buffer = 5;
    const energy = 0.5 * particle.power! * (particle.speedX ** 2 + particle.speedY ** 2);

    if (particle.x < buffer) {
      this.energyMarkers[0].outflow += energy;
      particle.x = this.canvasWidth - buffer;
    } else if (particle.x > this.canvasWidth - buffer) {
      this.energyMarkers[1].outflow += energy;
      particle.x = buffer;
    }

    if (particle.y < buffer) {
      this.energyMarkers[2].outflow += energy;
      particle.y = this.canvasHeight - buffer;
    } else if (particle.y > this.canvasHeight - buffer) {
      this.energyMarkers[3].outflow += energy;
      particle.y = buffer;
    }
  }

  private resetParticle(particle: WindParticle) {
    const angleRad = this.windAngle * Math.PI / 180;
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
}
