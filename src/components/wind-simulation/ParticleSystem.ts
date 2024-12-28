import { WindParticle, Obstacle, WindTrail } from './types';

export class ParticleSystem {
  private particles: WindParticle[] = [];
  private trails: WindTrail[] = [];
  private ctx: CanvasRenderingContext2D;
  private canvasWidth: number;
  private canvasHeight: number;
  private windSpeed: number;
  private windAngle: number;
  private windCurve: number;
  private obstacles: Obstacle[];
  private readonly PARTICLE_LIFETIME = 300;
  private readonly TRAIL_LENGTH = 30;
  private readonly COLLISION_COLOR = 'rgba(255, 182, 193, 0.9)';
  private readonly DEFAULT_COLOR = 'rgba(57, 255, 20, 0.8)';

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
    const angleRad = (this.windAngle * Math.PI) / 180;
    this.particles = Array.from({ length: particleDensity }, () => ({
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

  private checkCollision(particle: WindParticle, obstacle: Obstacle): boolean {
    const buffer = 2; // Small buffer to prevent sticking
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
      
      return Math.abs(area - (a1 + a2 + a3)) < buffer;
    }
    
    return (
      particle.x >= obstacle.x - buffer &&
      particle.x <= obstacle.x + obstacle.width + buffer &&
      particle.y >= obstacle.y - buffer &&
      particle.y <= obstacle.y + obstacle.height + buffer
    );
  }

  private updateParticle(particle: WindParticle) {
    // Store current position for trail
    if (particle.trail) {
      particle.trail.unshift({ x: particle.x, y: particle.y });
      if (particle.trail.length > this.TRAIL_LENGTH) {
        particle.trail.pop();
      }
    }

    let hasCollided = false;
    this.obstacles.forEach(obstacle => {
      if (this.checkCollision(particle, obstacle)) {
        hasCollided = true;
        // More natural bounce behavior
        const normalX = Math.random() - 0.5;
        const normalY = Math.random() - 0.5;
        const bounceForce = 0.7;
        
        particle.speedX = (normalX * this.windSpeed * bounceForce) + (Math.random() - 0.5);
        particle.speedY = (normalY * this.windSpeed * bounceForce) + (Math.random() - 0.5);
        particle.color = 'rgba(255, 182, 193, 0.9)'; // Pastel red
        particle.collisionTimer = 60; // Frames to keep red color
      }
    });

    // Add natural wind turbulence
    particle.speedX += (Math.random() - 0.5) * 0.1;
    particle.speedY += (Math.random() - 0.5) * 0.1;
    
    // Apply wind curve
    particle.speedY += Math.sin(particle.x / this.canvasWidth * Math.PI * 2) * this.windCurve;

    // Update position
    particle.x += particle.speedX;
    particle.y += particle.speedY;

    // Wrap around edges
    if (particle.x > this.canvasWidth) particle.x = 0;
    if (particle.x < 0) particle.x = this.canvasWidth;
    if (particle.y > this.canvasHeight) particle.y = 0;
    if (particle.y < 0) particle.y = this.canvasHeight;

    // Update collision timer and color
    if (particle.collisionTimer > 0) {
      particle.collisionTimer--;
      if (particle.collisionTimer === 0) {
        particle.color = 'rgba(57, 255, 20, 0.8)';
      }
    }

    // Update lifetime
    particle.lifetime--;
    if (particle.lifetime <= 0) {
      // Reset particle
      particle.x = Math.random() * this.canvasWidth;
      particle.y = Math.random() * this.canvasHeight;
      particle.lifetime = this.PARTICLE_LIFETIME;
      particle.trail = [];
      particle.hasCollided = false;
      particle.collisionTimer = 0;
    }
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

  public addWindTrail(x: number, y: number, angle: number) {
    const trail: WindTrail = {
      points: [{ x, y }],
      power: this.windSpeed * 2,
      angle: angle,
      lifetime: 100
    };
    this.trails.push(trail);
  }

  public update() {
    // Update and draw particles
    this.particles.forEach(particle => {
      this.updateParticle(particle);
      this.drawParticle(particle);
    });

    // Update and draw wind trails
    this.trails = this.trails.filter(trail => {
      if (trail.lifetime > 0) {
        this.updateWindTrail(trail);
        return true;
      }
      return false;
    });
  }

  private updateWindTrail(trail: WindTrail) {
    const lastPoint = trail.points[trail.points.length - 1];
    const angleRad = (trail.angle * Math.PI) / 180;
    
    const newPoint = {
      x: lastPoint.x + Math.cos(angleRad) * trail.power,
      y: lastPoint.y + Math.sin(angleRad) * trail.power
    };

    trail.points.push(newPoint);
    if (trail.points.length > this.TRAIL_LENGTH) {
      trail.points.shift();
    }

    // Draw trail
    this.ctx.beginPath();
    this.ctx.moveTo(trail.points[0].x, trail.points[0].y);
    trail.points.forEach(point => {
      this.ctx.lineTo(point.x, point.y);
    });
    this.ctx.strokeStyle = `rgba(57, 255, 20, ${trail.lifetime / 100})`;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    trail.lifetime--;
  }
}
