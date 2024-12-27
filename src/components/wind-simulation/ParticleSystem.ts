import { WindParticle, createWindParticle } from './WindParticle';
import { Obstacle } from './types';

export class ParticleSystem {
  private particles: WindParticle[] = [];
  private ctx: CanvasRenderingContext2D;
  private canvasWidth: number;
  private canvasHeight: number;
  private windSpeed: number;
  private windAngle: number;
  private windCurve: number;
  private obstacles: Obstacle[];

  constructor(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    windSpeed: number,
    windAngle: number,
    windCurve: number,
    particleDensity: number,
    obstacles: Obstacle[]
  ) {
    this.ctx = ctx;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.windSpeed = windSpeed;
    this.windAngle = windAngle;
    this.windCurve = windCurve;
    this.obstacles = obstacles;
    this.createParticles(particleDensity);
  }

  private createParticles(particleDensity: number) {
    this.particles = Array.from({ length: particleDensity }, () =>
      createWindParticle(this.canvasWidth, this.canvasHeight, this.windSpeed, this.windAngle)
    );
  }

  private checkCollision(particle: WindParticle, obstacle: Obstacle): boolean {
    if (obstacle.type === "tree") {
      // Triangle collision detection for trees
      const px = particle.x;
      const py = particle.y;
      const x1 = obstacle.x;
      const y1 = obstacle.y + obstacle.height;
      const x2 = obstacle.x + obstacle.width / 2;
      const y2 = obstacle.y;
      const x3 = obstacle.x + obstacle.width;
      const y3 = obstacle.y + obstacle.height;
      
      const area = Math.abs((x1*(y2-y3) + x2*(y3-y1)+ x3*(y1-y2))/2.0);
      const a1 = Math.abs((px*(y2-y3) + x2*(y3-py)+ x3*(py-y2))/2.0);
      const a2 = Math.abs((x1*(py-y3) + px*(y3-y1)+ x3*(y1-py))/2.0);
      const a3 = Math.abs((x1*(y2-py) + x2*(py-y1)+ px*(y1-y2))/2.0);
      
      return Math.abs(area - (a1 + a2 + a3)) < 0.1;
    }
    
    return (
      particle.x >= obstacle.x - 5 &&
      particle.x <= obstacle.x + obstacle.width + 5 &&
      particle.y >= obstacle.y - 5 &&
      particle.y <= obstacle.y + obstacle.height + 5
    );
  }

  private updateParticle(particle: WindParticle) {
    let hasCollided = false;
    
    this.obstacles.forEach(obstacle => {
      if (this.checkCollision(particle, obstacle)) {
        hasCollided = true;
        particle.speedX *= -0.5;
        particle.speedY *= -0.5;
        particle.speedY += (Math.random() - 0.5) * this.windSpeed / 2;
        particle.speedX += (Math.random() - 0.5) * this.windSpeed / 2;
        particle.color = `rgba(255, 100, 20, ${0.7 + Math.random() * 0.3})`;
        particle.trailTime = 100; // Trail effect duration
      }
    });

    if (hasCollided) {
      particle.hasCollided = true;
    }

    particle.speedY += Math.sin(particle.x / this.canvasWidth * Math.PI * 2) * this.windCurve;
    particle.x += particle.speedX;
    particle.y += particle.speedY;

    if (particle.x > this.canvasWidth) particle.x = 0;
    if (particle.x < 0) particle.x = this.canvasWidth;
    if (particle.y > this.canvasHeight) particle.y = 0;
    if (particle.y < 0) particle.y = this.canvasHeight;

    if (particle.trailTime && particle.trailTime > 0) {
      particle.trailTime--;
    }
  }

  private drawParticle(particle: WindParticle) {
    this.ctx.fillStyle = particle.color;
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw trail for collided particles
    if (particle.hasCollided && particle.trailTime && particle.trailTime > 0) {
      this.ctx.strokeStyle = `rgba(255, 100, 20, ${particle.trailTime / 100})`;
      this.ctx.lineWidth = particle.size / 2;
      this.ctx.beginPath();
      this.ctx.moveTo(particle.x - particle.speedX * 5, particle.y - particle.speedY * 5);
      this.ctx.lineTo(particle.x, particle.y);
      this.ctx.stroke();
    }
  }

  public update() {
    this.particles.forEach(particle => {
      this.updateParticle(particle);
      this.drawParticle(particle);
    });
  }

  public setParticleDensity(density: number) {
    this.createParticles(density);
  }
}