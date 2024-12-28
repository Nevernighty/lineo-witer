import { WindParticle, Obstacle, WindTrail, EnergyMarker } from './types';

export class ParticleSystem {
  private particles: WindParticle[] = [];
  private trails: WindTrail[] = [];
  private energyMarkers: EnergyMarker[] = [];
  private readonly PARTICLE_LIFETIME = 300;
  private readonly TRAIL_LENGTH = 30;
  private readonly COLLISION_COLOR = 'rgba(255, 182, 193, 0.9)';
  private readonly DEFAULT_COLOR = 'rgba(57, 255, 20, 0.8)';

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

  private updateParticle(particle: WindParticle) {
    // Apply wind force
    const windForce = this.windSpeed * 0.1;
    particle.speedX += Math.cos(this.windAngle * Math.PI / 180) * windForce;
    particle.speedY += Math.sin(this.windAngle * Math.PI / 180) * windForce;

    // Apply drag force
    const drag = 0.02;
    particle.speedX *= (1 - drag);
    particle.speedY *= (1 - drag);

    // Update position
    particle.x += particle.speedX;
    particle.y += particle.speedY;

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
  }

  private drawEnergyMarkers() {
    this.energyMarkers.forEach(marker => {
      const x = marker.position === 'left' ? 0 : 
               marker.position === 'right' ? this.canvasWidth - 60 : 
               marker.position === 'top' ? this.canvasWidth / 2 - 30 : 
               this.canvasWidth / 2 - 30;
      
      const y = marker.position === 'top' ? 0 : 
               marker.position === 'bottom' ? this.canvasHeight - 20 : 
               this.canvasHeight / 2 - 10;

      this.ctx.fillStyle = 'rgba(57, 255, 20, 0.8)';
      this.ctx.fillText(`In: ${marker.inflow.toFixed(1)}`, x, y);
      this.ctx.fillText(`Out: ${marker.outflow.toFixed(1)}`, x, y + 15);
    });
  }

  public update() {
    // Reset energy measurements
    this.energyMarkers.forEach(marker => {
      marker.inflow = 0;
      marker.outflow = 0;
    });

    // Update and draw particles
    this.particles.forEach(particle => {
      this.updateParticle(particle);
      this.drawParticle(particle);
    });

    // Draw energy markers
    this.drawEnergyMarkers();

    // Update trails
    this.trails = this.trails.filter(trail => {
      if (trail.lifetime > 0) {
        trail.lifetime--;
        return true;
      }
      return false;
    });
  }

  private drawParticle(particle: WindParticle) {
    // Draw trail
    if (particle.trail && particle.trail.length > 1) {
      this.ctx.beginPath();
      this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
      for (let i = 1; i < particle.trail.length; i++) {
        this.ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
      }
      this.ctx.strokeStyle = `rgba(${particle.collisionTimer > 0 ? '255, 182, 193' : '57, 255, 20'}, ${0.3 * (particle.trail.length / this.TRAIL_LENGTH)})`;
      this.ctx.lineWidth = particle.size / 2;
      this.ctx.stroke();
    }

    // Draw particle
    this.ctx.fillStyle = particle.color;
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    this.ctx.fill();
  }
}
