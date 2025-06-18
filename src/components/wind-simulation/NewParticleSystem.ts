
import { WindParticle, Obstacle } from "./types";

export class NewParticleSystem {
  private particles: WindParticle[] = [];
  private animationId: number | null = null;
  private lastTime: number = 0;
  private collisionEffects: Array<{ x: number; y: number; lifetime: number; energy: number }> = [];
  private totalCollisionEnergy: number = 0;

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
        power: this.windSpeed,
        originalColor: `rgba(57, 255, 20, ${0.6 + Math.random() * 0.4})`
      });
    }
  }

  public updateSettings(windSpeed: number, windAngle: number, particleCount: number) {
    this.windSpeed = windSpeed;
    this.windAngle = windAngle;
    this.particleCount = Math.max(1, Math.min(200, particleCount));
    this.obstacles = this.obstacles; // Keep existing obstacles
    this.initializeParticles();
  }

  public setObstacles(obstacles: Obstacle[]) {
    this.obstacles = obstacles;
  }

  public updateDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.initializeParticles();
  }

  private checkCollisionWithObstacle(particle: WindParticle, obstacle: Obstacle): boolean {
    return (
      particle.x >= obstacle.x &&
      particle.x <= obstacle.x + obstacle.width &&
      particle.y >= obstacle.y &&
      particle.y <= obstacle.y + obstacle.height
    );
  }

  private handleCollisionResponse(particle: WindParticle, obstacle: Obstacle) {
    // Calculate collision energy
    const speed = Math.sqrt(particle.speedX * particle.speedX + particle.speedY * particle.speedY);
    const collisionEnergy = 0.5 * particle.power! * speed * speed;
    
    // Add collision effect at impact point
    this.collisionEffects.push({
      x: particle.x,
      y: particle.y,
      lifetime: 30,
      energy: collisionEnergy
    });

    // Update total collision energy
    this.totalCollisionEnergy += collisionEnergy;

    // Calculate collision normal
    const centerX = obstacle.x + obstacle.width / 2;
    const centerY = obstacle.y + obstacle.height / 2;
    
    const dx = particle.x - centerX;
    const dy = particle.y - centerY;
    
    // Determine which side was hit and reflect accordingly
    if (Math.abs(dx) > Math.abs(dy)) {
      // Hit left or right side
      particle.speedX *= -0.7; // Reverse and dampen
      particle.x = dx > 0 ? obstacle.x + obstacle.width + 2 : obstacle.x - 2;
    } else {
      // Hit top or bottom side
      particle.speedY *= -0.7; // Reverse and dampen
      particle.y = dy > 0 ? obstacle.y + obstacle.height + 2 : obstacle.y - 2;
    }

    // Add some randomness to prevent particles getting stuck
    particle.speedX += (Math.random() - 0.5) * 2;
    particle.speedY += (Math.random() - 0.5) * 2;

    // Change particle appearance
    particle.hasCollided = true;
    particle.collisionTimer = 60; // Frames to stay red
    particle.color = 'rgba(255, 100, 20, 0.9)'; // Bright orange-red
    particle.size *= 1.5; // Make it bigger temporarily
  }

  private updateParticle(particle: WindParticle, deltaTime: number) {
    const angleRad = (this.windAngle * Math.PI) / 180;
    const time = performance.now() * 0.001;
    
    // Add turbulence for natural movement
    const turbulence = Math.sin(time + particle.x * 0.01) * 0.5;
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
      if (particle.trail.length > 12) {
        particle.trail.pop();
      }
    }
    
    // Check obstacle collisions
    this.checkCollisions(particle);

    // Handle collision timer
    if (particle.collisionTimer > 0) {
      particle.collisionTimer--;
      if (particle.collisionTimer === 0) {
        // Reset particle appearance
        particle.hasCollided = false;
        particle.color = particle.originalColor || 'rgba(57, 255, 20, 0.8)';
        particle.size = Math.max(1, particle.size / 1.5); // Reset size
      }
    }
  }

  private checkCollisions(particle: WindParticle) {
    for (const obstacle of this.obstacles) {
      if (this.checkCollisionWithObstacle(particle, obstacle)) {
        if (!particle.hasCollided) { // Only trigger once per collision
          this.handleCollisionResponse(particle, obstacle);
        }
        break;
      }
    }
  }

  private drawParticle(particle: WindParticle) {
    // Draw trail with improved visibility
    if (particle.trail && particle.trail.length > 1) {
      this.ctx.beginPath();
      this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
      
      for (let i = 1; i < particle.trail.length; i++) {
        const alpha = (1 - i / particle.trail.length) * 0.4;
        this.ctx.strokeStyle = particle.hasCollided 
          ? `rgba(255, 100, 20, ${alpha})` 
          : `rgba(57, 255, 20, ${alpha})`;
        this.ctx.lineWidth = particle.size * 0.3;
        this.ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
      }
      this.ctx.stroke();
    }
    
    // Draw particle with glow effect
    if (particle.hasCollided) {
      // Enhanced glow for collided particles
      this.ctx.shadowColor = 'rgba(255, 100, 20, 0.8)';
      this.ctx.shadowBlur = particle.size * 3;
    } else {
      this.ctx.shadowColor = 'rgba(57, 255, 20, 0.5)';
      this.ctx.shadowBlur = particle.size * 2;
    }
    
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    this.ctx.fillStyle = particle.color;
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  private drawCollisionEffects() {
    this.collisionEffects.forEach((effect, index) => {
      const alpha = effect.lifetime / 30;
      const size = (30 - effect.lifetime) * 0.5;
      
      // Draw explosion effect
      this.ctx.beginPath();
      this.ctx.arc(effect.x, effect.y, size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.7})`;
      this.ctx.fill();
      
      // Draw outer ring
      this.ctx.beginPath();
      this.ctx.arc(effect.x, effect.y, size * 1.5, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(255, 100, 20, ${alpha * 0.5})`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      effect.lifetime--;
    });
    
    // Remove expired effects
    this.collisionEffects = this.collisionEffects.filter(effect => effect.lifetime > 0);
  }

  public update() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Decay collision energy over time
    this.totalCollisionEnergy *= 0.995;
    
    // Clear canvas with fade effect
    this.ctx.fillStyle = 'rgba(26, 31, 44, 0.1)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Update and draw particles
    this.particles.forEach(particle => {
      this.updateParticle(particle, deltaTime);
      this.drawParticle(particle);
    });
    
    // Draw collision effects
    this.drawCollisionEffects();
    
    // Draw statistics
    this.drawStats();
  }

  private drawStats() {
    this.ctx.fillStyle = 'rgba(26, 31, 44, 0.9)';
    this.ctx.fillRect(10, 10, 250, 140);
    
    this.ctx.fillStyle = 'rgba(57, 255, 20, 0.9)';
    this.ctx.font = '12px monospace';
    
    const collisionCount = this.particles.filter(p => p.hasCollided).length;
    
    const stats = [
      `Wind Speed: ${this.windSpeed.toFixed(1)} m/s`,
      `Wind Angle: ${this.windAngle.toFixed(0)}°`,
      `Particles: ${this.particles.length}`,
      `Obstacles: ${this.obstacles.length}`,
      `Active Collisions: ${collisionCount}`,
      `Total Collision Energy: ${this.totalCollisionEnergy.toFixed(1)} J`
    ];
    
    stats.forEach((stat, index) => {
      this.ctx.fillText(stat, 20, 30 + index * 18);
    });
  }

  public addWindBlast(x: number, y: number) {
    // Create temporary particles at click location
    const angleRad = (this.windAngle * Math.PI) / 180;
    for (let i = 0; i < 8; i++) {
      const angle = angleRad + (Math.random() - 0.5) * 1.0;
      const newParticle: WindParticle = {
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        z: 0,
        size: Math.random() * 5 + 3,
        speedX: Math.cos(angle) * this.windSpeed * 3,
        speedY: Math.sin(angle) * this.windSpeed * 3,
        speedZ: 0,
        color: 'rgba(255, 255, 100, 0.9)',
        lifetime: 120,
        trail: [],
        hasCollided: false,
        collisionTimer: 0,
        power: this.windSpeed * 3,
        originalColor: 'rgba(255, 255, 100, 0.9)'
      };
      this.particles.push(newParticle);
    }
  }

  public cleanup() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  public getCollisionEnergy(): number {
    return this.totalCollisionEnergy;
  }
}
