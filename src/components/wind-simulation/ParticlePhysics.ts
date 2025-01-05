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
    const angleRad = (this.windAngle * Math.PI) / 180;
    const baseSpeed = this.windSpeed * (0.8 + Math.random() * 0.4);
    
    // Add natural variation
    const turbulence = Math.sin(performance.now() * 0.001 + particle.x * 0.1) * 0.5;
    const curveEffect = Math.sin(particle.x * 0.01 + particle.y * 0.01) * this.windCurve;
    
    // Calculate final angle with turbulence and curve
    const finalAngle = angleRad + curveEffect + turbulence * 0.1;
    
    // Update velocities with smooth interpolation
    const targetSpeedX = Math.cos(finalAngle) * baseSpeed;
    const targetSpeedY = Math.sin(finalAngle) * baseSpeed;
    
    particle.speedX += (targetSpeedX - particle.speedX) * 0.1;
    particle.speedY += (targetSpeedY - particle.speedY) * 0.1;
    
    // Update position with deltaTime scaling
    particle.x += particle.speedX * (deltaTime / 16);
    particle.y += particle.speedY * (deltaTime / 16);
    
    return particle;
  }

  public handleBorderWrapping(particle: WindParticle): { x: number; y: number } {
    const buffer = 5;
    let newX = particle.x;
    let newY = particle.y;
    
    if (particle.x < -buffer) {
      newX = this.canvasWidth - buffer;
    } else if (particle.x > this.canvasWidth + buffer) {
      newX = buffer;
    }
    
    if (particle.y < -buffer) {
      newY = this.canvasHeight - buffer;
    } else if (particle.y > this.canvasHeight + buffer) {
      newY = buffer;
    }
    
    return { x: newX, y: newY };
  }
}