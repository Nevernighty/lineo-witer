import { WindParticle, Obstacle, WindTrail, EnergyMarker } from './types';
import { WindTrails } from './WindTrails';

export class ParticleSystem {
  private particles: WindParticle[] = [];
  private trails: WindTrail[] = [];
  private energyMarkers: EnergyMarker[] = [];
  private readonly PARTICLE_LIFETIME = 300;
  private readonly TRAIL_LENGTH = 50;
  private readonly COLLISION_COLOR = 'rgba(255, 182, 193, 0.9)';
  private readonly DEFAULT_COLOR = 'rgba(57, 255, 20, 0.8)';
  private windTrails: WindTrails;
  private lastTime: number = 0;
  private readonly SPAWN_INTERVAL = 16;
  private turbulenceOffset: number = 0;
  private totalCollisionEnergy: number = 0;

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
    this.createParticles(); // Recreate particles when dimensions change
  }

  private createParticles() {
    // Clear existing particles
    this.particles = [];
    
    // Create new particles based on density
    const particleCount = Math.floor(this.particleDensity * 2); // Adjust multiplier as needed
    
    for (let i = 0; i < particleCount; i++) {
      const angleRad = (this.windAngle * Math.PI) / 180;
      const particle: WindParticle = {
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        size: Math.random() * 2 + 1,
        speedX: Math.cos(angleRad) * this.windSpeed * (Math.random() * 0.5 + 0.75),
        speedY: Math.sin(angleRad) * this.windSpeed * (Math.random() * 0.5 + 0.75),
        color: this.DEFAULT_COLOR,
        lifetime: this.PARTICLE_LIFETIME,
        trail: [],
        hasCollided: false,
        collisionTimer: 0,
        power: this.windSpeed,
        collisionEnergy: 0
      };
      this.particles.push(particle);
    }
  }

  private updateParticle(particle: WindParticle, deltaTime: number) {
    const angleRad = (this.windAngle * Math.PI) / 180;
    const windForceX = Math.cos(angleRad) * this.windSpeed;
    const windForceY = Math.sin(angleRad) * this.windSpeed;
    
    // Apply wind curve effect
    const curveEffect = Math.sin(particle.x * 0.01 + particle.y * 0.01) * this.windCurve;
    const curveAngle = angleRad + curveEffect;
    
    // Calculate target velocities with curve effect
    const targetSpeedX = Math.cos(curveAngle) * this.windSpeed;
    const targetSpeedY = Math.sin(curveAngle) * this.windSpeed;
    
    // Smoothly interpolate current speed to target speed
    particle.speedX += (targetSpeedX - particle.speedX) * 0.1;
    particle.speedY += (targetSpeedY - particle.speedY) * 0.1;
    
    // Add some natural variation
    const turbulence = Math.sin((performance.now() + this.turbulenceOffset) * 0.001) * 0.2;
    particle.speedX += turbulence * this.windSpeed * 0.1;
    particle.speedY += turbulence * this.windSpeed * 0.1;
    
    // Update position
    particle.x += particle.speedX * (deltaTime / 16);
    particle.y += particle.speedY * (deltaTime / 16);

    // Handle obstacle collisions
    this.handleObstacleCollisions(particle);

    // Update trail
    if (particle.trail) {
      particle.trail.unshift({ x: particle.x, y: particle.y });
      if (particle.trail.length > this.TRAIL_LENGTH) {
        particle.trail.pop();
      }
    }

    // Handle border wrapping with energy calculation
    this.handleBorderCollision(particle);

    // Reset particle if it goes too far outside the canvas
    const buffer = 50;
    if (
      particle.x < -buffer ||
      particle.x > this.canvasWidth + buffer ||
      particle.y < -buffer ||
      particle.y > this.canvasHeight + buffer
    ) {
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

          // Calculate collision energy
          const speed = Math.sqrt(particle.speedX ** 2 + particle.speedY ** 2);
          const collisionEnergy = 0.5 * speed ** 2;
          particle.collisionEnergy = collisionEnergy;
          this.totalCollisionEnergy += collisionEnergy;

          // Calculate reflection
          const centerX = obstacle.x + obstacle.width / 2;
          const centerY = obstacle.y + obstacle.height / 2;
          const normalX = (particle.x - centerX) / (obstacle.width / 2);
          const normalY = (particle.y - centerY) / (obstacle.height / 2);
          const normalLength = Math.sqrt(normalX ** 2 + normalY ** 2);
          
          // Normalize and apply reflection
          const nx = normalX / normalLength;
          const ny = normalY / normalLength;
          const dotProduct = particle.speedX * nx + particle.speedY * ny;
          
          particle.speedX = (particle.speedX - 2 * dotProduct * nx) * 0.8;
          particle.speedY = (particle.speedY - 2 * dotProduct * ny) * 0.8;
        }
      }
    }

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

    if (particle.x < buffer) {
      this.energyMarkers[0].outflow += energy;
      this.createGlowEffect(0, particle.y, energy);
      particle.x = this.canvasWidth - buffer;
    } else if (particle.x > this.canvasWidth - buffer) {
      this.energyMarkers[1].outflow += energy;
      this.createGlowEffect(this.canvasWidth, particle.y, energy);
      particle.x = buffer;
    }

    if (particle.y < buffer) {
      this.energyMarkers[2].outflow += energy;
      this.createGlowEffect(particle.x, 0, energy);
      particle.y = this.canvasHeight - buffer;
    } else if (particle.y > this.canvasHeight - buffer) {
      this.energyMarkers[3].outflow += energy;
      this.createGlowEffect(particle.x, this.canvasHeight, energy);
      particle.y = buffer;
    }
  }

  private createGlowEffect(x: number, y: number, value: number) {
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = 'rgba(57, 255, 20, 0.8)';
    this.ctx.fillStyle = `rgba(57, 255, 20, ${Math.min(value / 10, 0.8)})`;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  private resetParticle(particle: WindParticle) {
    const angleRad = (this.windAngle * Math.PI) / 180;
    // Reset position to the upwind edge of the canvas
    if (Math.abs(Math.cos(angleRad)) > Math.abs(Math.sin(angleRad))) {
      particle.x = Math.cos(angleRad) > 0 ? 0 : this.canvasWidth;
      particle.y = Math.random() * this.canvasHeight;
    } else {
      particle.x = Math.random() * this.canvasWidth;
      particle.y = Math.sin(angleRad) > 0 ? 0 : this.canvasHeight;
    }
    
    particle.speedX = Math.cos(angleRad) * this.windSpeed * (Math.random() * 0.5 + 0.75);
    particle.speedY = Math.sin(angleRad) * this.windSpeed * (Math.random() * 0.5 + 0.75);
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

    // Update particles
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
    // Draw trail
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

    // Draw particle
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

      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = 'rgba(57, 255, 20, 0.8)';
      this.ctx.fillStyle = 'rgba(57, 255, 20, 0.8)';
      this.ctx.font = '12px monospace';
      this.ctx.fillText(`In: ${(marker.inflow * this.windSpeed).toFixed(1)}W`, x, y);
      this.ctx.fillText(`Out: ${(marker.outflow * this.windSpeed).toFixed(1)}W`, x, y + 15);
      this.ctx.shadowBlur = 0;
    });
  }

  private initializeEnergyMarkers() {
    this.energyMarkers = [
      { position: 'left', inflow: 0, outflow: 0 },
      { position: 'right', inflow: 0, outflow: 0 },
      { position: 'top', inflow: 0, outflow: 0 },
      { position: 'bottom', inflow: 0, outflow: 0 }
    ];
  }

  public getCollisionEnergy(): number {
    return this.totalCollisionEnergy;
  }

  public addWindTrail(x: number, y: number, angle: number, power: number) {
    this.windTrails.addWindTrail(x, y, angle, power);
  }
}