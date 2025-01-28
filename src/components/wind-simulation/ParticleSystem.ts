import { WindParticle, Obstacle } from './types';
import { EnergyCalculator } from './EnergyCalculator';
import { ParticlePhysics } from './ParticlePhysics';

export class ParticleSystem {
  private particles: WindParticle[] = [];
  private physics: ParticlePhysics;
  private energyCalculator: EnergyCalculator;
  private lastTime: number = 0;
  private readonly MAX_PARTICLES = 1000;

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
    this.physics = new ParticlePhysics(canvasWidth, canvasHeight, windSpeed, windAngle, windCurve);
    this.energyCalculator = new EnergyCalculator();
    this.createParticles();
    this.lastTime = performance.now();
  }

  public updateDimensions(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.physics = new ParticlePhysics(width, height, this.windSpeed, this.windAngle, this.windCurve);
  }

  private createParticles() {
    const targetCount = Math.min(
      Math.floor(this.particleDensity * (this.canvasWidth * this.canvasHeight) / 50000),
      this.MAX_PARTICLES
    );
    
    while (this.particles.length < targetCount) {
      this.particles.push(this.createParticle());
    }
    
    // Remove excess particles if density is lowered
    if (this.particles.length > targetCount) {
      this.particles.length = targetCount;
    }
  }

  private createParticle(): WindParticle {
    const angleRad = (this.windAngle * Math.PI) / 180;
    return {
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
    };
  }

  public update() {
    const currentTime = performance.now();
    const deltaTime = Math.min(currentTime - this.lastTime, 32); // Cap at ~30 FPS
    this.lastTime = currentTime;

    // Update particle count based on density
    this.createParticles();

    this.particles.forEach(particle => {
      // Update particle physics
      const updatedParticle = this.physics.updateParticle(particle, deltaTime);
      
      // Handle collisions
      this.handleCollisions(updatedParticle);
      
      // Update trails
      if (particle.trail) {
        particle.trail.unshift({ x: particle.x, y: particle.y });
        if (particle.trail.length > 50) particle.trail.pop();
      }
      
      // Handle border wrapping
      const { x, y } = this.physics.handleBorderWrapping(updatedParticle);
      particle.x = x;
      particle.y = y;
      
      // Calculate and record energy
      const particleEnergy = 0.5 * particle.power! * (particle.speedX ** 2 + particle.speedY ** 2);
      this.energyCalculator.addEnergyReading(particleEnergy);
    });

    this.draw();
  }

  private handleCollisions(particle: WindParticle) {
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
          particle.color = 'rgba(255, 182, 193, 0.9)';
          
          // Calculate collision normal
          const centerX = obstacle.x + obstacle.width / 2;
          const centerY = obstacle.y + obstacle.height / 2;
          const normalX = (particle.x - centerX) / (obstacle.width / 2);
          const normalY = (particle.y - centerY) / (obstacle.height / 2);
          const normalLength = Math.sqrt(normalX ** 2 + normalY ** 2);
          
          // Normalize vectors
          const nx = normalX / normalLength;
          const ny = normalY / normalLength;
          
          // Calculate reflection
          const dotProduct = particle.speedX * nx + particle.speedY * ny;
          const reflectionX = particle.speedX - 2 * dotProduct * nx;
          const reflectionY = particle.speedY - 2 * dotProduct * ny;
          
          // Apply reflection with energy loss
          const energyLoss = 0.8;
          particle.speedX = reflectionX * energyLoss;
          particle.speedY = reflectionY * energyLoss;
          
          // Add some randomness to prevent particles from getting stuck
          particle.speedX += (Math.random() - 0.5) * 0.5;
          particle.speedY += (Math.random() - 0.5) * 0.5;
        }
      }
    }

    if (particle.collisionTimer > 0) {
      particle.collisionTimer--;
      if (particle.collisionTimer === 0) {
        particle.hasCollided = false;
        particle.color = 'rgba(57, 255, 20, 0.8)';
      }
    }
  }

  private draw() {
    this.particles.forEach(particle => {
      // Draw trails with fade effect
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
        
        this.ctx.strokeStyle = `rgba(57, 255, 20, ${0.3 * (particle.trail.length / 50)})`;
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
    });
  }

  public getCollisionEnergy(): number {
    return this.energyCalculator.getAverageEnergy();
  }
}