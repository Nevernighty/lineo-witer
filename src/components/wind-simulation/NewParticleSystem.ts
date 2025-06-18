
import { WindParticle, Obstacle } from "./types";

export class NewParticleSystem {
  private particles: WindParticle[] = [];
  private animationId: number | null = null;
  private lastTime: number = 0;

  constructor(
    private ctx: CanvasRenderingContext2D,
    private width: number,
    private height: number,
    private windSpeed: number = 5,
    private windAngle: number = 0,
    private particleCount: number = 50,
    private obstacles: Obstacle[] = []
  ) {
    this.initializeParticles();
  }

  private initializeParticles() {
    this.particles = [];
    const angleRad = (this.windAngle * Math.PI) / 180;
    
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        z: 0,
        size: Math.random() * 3 + 1,
        speedX: Math.cos(angleRad) * this.windSpeed * (0.5 + Math.random() * 0.5),
        speedY: Math.sin(angleRad) * this.windSpeed * (0.5 + Math.random() * 0.5),
        speedZ: 0,
        color: `rgba(57, 255, 20, ${0.6 + Math.random() * 0.4})`,
        lifetime: Infinity,
        trail: [],
        hasCollided: false,
        collisionTimer: 0,
        power: this.windSpeed
      });
    }
  }

  public updateSettings(windSpeed: number, windAngle: number, particleCount: number) {
    this.windSpeed = windSpeed;
    this.windAngle = windAngle;
    this.particleCount = Math.max(1, Math.min(200, particleCount));
    this.initializeParticles();
  }

  public updateDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.initializeParticles();
  }

  private updateParticle(particle: WindParticle, deltaTime: number) {
    const angleRad = (this.windAngle * Math.PI) / 180;
    const time = performance.now() * 0.001;
    
    // Add turbulence for natural movement
    const turbulence = Math.sin(time + particle.x * 0.01) * 0.3;
    const finalAngle = angleRad + turbulence;
    
    // Update velocity towards wind direction
    const targetSpeedX = Math.cos(finalAngle) * this.windSpeed;
    const targetSpeedY = Math.sin(finalAngle) * this.windSpeed;
    
    particle.speedX += (targetSpeedX - particle.speedX) * 0.1;
    particle.speedY += (targetSpeedY - particle.speedY) * 0.1;
    
    // Update position
    particle.x += particle.speedX * deltaTime * 0.1;
    particle.y += particle.speedY * deltaTime * 0.1;
    
    // Handle boundaries (wrap around)
    if (particle.x < -10) particle.x = this.width + 10;
    if (particle.x > this.width + 10) particle.x = -10;
    if (particle.y < -10) particle.y = this.height + 10;
    if (particle.y > this.height + 10) particle.y = -10;
    
    // Update trail
    if (particle.trail) {
      particle.trail.unshift({ x: particle.x, y: particle.y, z: particle.z });
      if (particle.trail.length > 10) {
        particle.trail.pop();
      }
    }
    
    // Check obstacle collisions
    this.checkCollisions(particle);
  }

  private checkCollisions(particle: WindParticle) {
    for (const obstacle of this.obstacles) {
      if (
        particle.x >= obstacle.x &&
        particle.x <= obstacle.x + obstacle.width &&
        particle.y >= obstacle.y &&
        particle.y <= obstacle.y + obstacle.height
      ) {
        // Simple collision response - bounce off
        const centerX = obstacle.x + obstacle.width / 2;
        const centerY = obstacle.y + obstacle.height / 2;
        
        const dx = particle.x - centerX;
        const dy = particle.y - centerY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          particle.speedX *= -0.8;
        } else {
          particle.speedY *= -0.8;
        }
        
        particle.hasCollided = true;
        particle.collisionTimer = 10;
        particle.color = 'rgba(255, 100, 20, 0.8)';
        break;
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

  private drawParticle(particle: WindParticle) {
    // Draw trail
    if (particle.trail && particle.trail.length > 1) {
      this.ctx.beginPath();
      this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
      
      for (let i = 1; i < particle.trail.length; i++) {
        const alpha = (1 - i / particle.trail.length) * 0.3;
        this.ctx.strokeStyle = particle.hasCollided 
          ? `rgba(255, 100, 20, ${alpha})` 
          : `rgba(57, 255, 20, ${alpha})`;
        this.ctx.lineWidth = particle.size * 0.5;
        this.ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
      }
      this.ctx.stroke();
    }
    
    // Draw particle
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    this.ctx.fillStyle = particle.color;
    this.ctx.fill();
    
    // Add glow effect
    this.ctx.shadowColor = particle.color;
    this.ctx.shadowBlur = particle.size * 2;
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  public update() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Clear canvas with fade effect
    this.ctx.fillStyle = 'rgba(26, 31, 44, 0.1)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Update and draw particles
    this.particles.forEach(particle => {
      this.updateParticle(particle, deltaTime);
      this.drawParticle(particle);
    });
    
    // Draw statistics
    this.drawStats();
  }

  private drawStats() {
    this.ctx.fillStyle = 'rgba(26, 31, 44, 0.8)';
    this.ctx.fillRect(10, 10, 200, 120);
    
    this.ctx.fillStyle = 'rgba(57, 255, 20, 0.8)';
    this.ctx.font = '12px monospace';
    
    const stats = [
      `Wind Speed: ${this.windSpeed.toFixed(1)} m/s`,
      `Wind Angle: ${this.windAngle.toFixed(0)}°`,
      `Particles: ${this.particles.length}`,
      `Obstacles: ${this.obstacles.length}`
    ];
    
    stats.forEach((stat, index) => {
      this.ctx.fillText(stat, 20, 30 + index * 20);
    });
  }

  public addWindBlast(x: number, y: number) {
    // Create temporary particles at click location
    const angleRad = (this.windAngle * Math.PI) / 180;
    for (let i = 0; i < 5; i++) {
      const angle = angleRad + (Math.random() - 0.5) * 0.5;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        z: 0,
        size: Math.random() * 4 + 2,
        speedX: Math.cos(angle) * this.windSpeed * 2,
        speedY: Math.sin(angle) * this.windSpeed * 2,
        speedZ: 0,
        color: 'rgba(255, 255, 100, 0.8)',
        lifetime: 60,
        trail: [],
        hasCollided: false,
        collisionTimer: 0,
        power: this.windSpeed * 2
      });
    }
  }

  public cleanup() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
