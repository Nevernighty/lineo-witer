import { WindParticle } from './types';

export class ParticlePhysics {
  constructor(
    private canvasWidth: number,
    private canvasHeight: number,
    private windSpeed: number,
    private windAngle: number,
    private windCurve: number
  ) {}

  public updateParticle(particle: WindParticle, deltaTime: number) {
    // Apply wind force with improved physics
    const angleRad = (this.windAngle * Math.PI) / 180;
    const baseSpeed = this.windSpeed * (0.8 + Math.random() * 0.4);
    
    // Enhanced turbulence and natural variation
    const turbulence = Math.sin(performance.now() * 0.001 + particle.x * 0.1) * 0.5;
    const curveEffect = Math.sin(particle.x * 0.01 + particle.y * 0.01) * this.windCurve;
    
    // Calculate final angle with improved dynamics
    const finalAngle = angleRad + curveEffect + turbulence * 0.1;
    
    // Target speeds with natural movement
    const targetSpeedX = Math.cos(finalAngle) * baseSpeed * (1 + Math.random() * 0.2);
    const targetSpeedY = Math.sin(finalAngle) * baseSpeed * (1 + Math.random() * 0.2);
    
    // Smooth velocity transitions
    const lerpFactor = 0.1;
    particle.speedX += (targetSpeedX - particle.speedX) * lerpFactor;
    particle.speedY += (targetSpeedY - particle.speedY) * lerpFactor;
    
    // Apply velocity with deltaTime scaling
    particle.x += particle.speedX * (deltaTime / 16);
    particle.y += particle.speedY * (deltaTime / 16);
    
    return particle;
  }

  public handleBorderWrapping(particle: WindParticle): { x: number; y: number } {
    const buffer = 5;
    let newX = particle.x;
    let newY = particle.y;
    
    // Improved border wrapping with smooth transitions
    if (particle.x < -buffer) {
      newX = this.canvasWidth + (particle.x % this.canvasWidth);
    } else if (particle.x > this.canvasWidth + buffer) {
      newX = particle.x % this.canvasWidth;
    }
    
    if (particle.y < -buffer) {
      newY = this.canvasHeight + (particle.y % this.canvasHeight);
    } else if (particle.y > this.canvasHeight + buffer) {
      newY = particle.y % this.canvasHeight;
    }
    
    return { x: newX, y: newY };
  }
}