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
  private readonly SPAWN_INTERVAL = 16; // ~60fps

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

  public addWindTrail(x: number, y: number, angle: number) {
    this.windTrails.addWindTrail(x, y, angle, this.windSpeed * 2);
  }

  private createParticles() {
    const angleRad = (this.windAngle * Math.PI) / 180;
    this.particles = Array.from({ length: this.particleDensity }, () => ({
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
    }));
  }

  private updateParticle(particle: WindParticle, deltaTime: number) {
    // Apply wind force with smooth acceleration
    const windForce = this.windSpeed * 0.1 * (deltaTime / 16);
    const angleRad = this.windAngle * Math.PI / 180;
    
    // Add some natural variation to particle movement
    const turbulence = Math.sin(performance.now() * 0.001 + particle.x * 0.1) * 0.2;
    
    particle.speedX += (Math.cos(angleRad) * windForce + turbulence);
    particle.speedY += (Math.sin(angleRad) * windForce + turbulence);

    // Apply drag force
    const drag = 0.02 * (deltaTime / 16);
    particle.speedX *= (1 - drag);
    particle.speedY *= (1 - drag);

    // Update position
    particle.x += particle.speedX * (deltaTime / 16);
    particle.y += particle.speedY * (deltaTime / 16);

    // Check for obstacle collisions
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
          
          // Calculate reflection angle based on obstacle surface
          const normalX = particle.x < obstacle.x + obstacle.width / 2 ? -1 : 1;
          const normalY = particle.y < obstacle.y + obstacle.height / 2 ? -1 : 1;
          
          // Apply reflection with energy loss
          particle.speedX = -particle.speedX * 0.8 * normalX;
          particle.speedY = -particle.speedY * 0.8 * normalY;
        }
      }
    });

    // Update collision state
    if (particle.collisionTimer > 0) {
      particle.collisionTimer--;
      if (particle.collisionTimer === 0) {
        particle.hasCollided = false;
        particle.color = this.DEFAULT_COLOR;
      }
    }

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
}