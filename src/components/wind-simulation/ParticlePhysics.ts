
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
    // Enhanced wind force with improved physics
    const angleRad = (this.windAngle * Math.PI) / 180;
    const baseSpeed = this.windSpeed * (0.8 + Math.random() * 0.4);
    
    // Improved turbulence and natural variation
    const time = performance.now() * 0.001;
    const turbulence = Math.sin(time + particle.x * 0.1) * 0.5 + 
                      Math.cos(time * 1.5 + particle.y * 0.1) * 0.3;
    
    // Enhanced curve effect with wind speed influence
    const curveEffect = Math.sin(particle.x * 0.01 + particle.y * 0.01) * 
                       this.windCurve * (1 + this.windSpeed * 0.1);
    
    // Calculate final angle with improved dynamics
    const finalAngle = angleRad + curveEffect + turbulence * 0.2;
    
    // Target speeds with enhanced natural movement
    const targetSpeedX = Math.cos(finalAngle) * baseSpeed * (1 + Math.random() * 0.3);
    const targetSpeedY = Math.sin(finalAngle) * baseSpeed * (1 + Math.random() * 0.3);
    
    // Adaptive lerp factor based on wind speed and particle state
    const lerpFactor = 0.15 * (this.windSpeed / 10) * (particle.hasCollided ? 0.5 : 1);
    
    // Update velocities with improved smoothing
    particle.speedX += (targetSpeedX - particle.speedX) * lerpFactor;
    particle.speedY += (targetSpeedY - particle.speedY) * lerpFactor;
    
    // Apply minimum speed threshold
    const currentSpeed = Math.sqrt(particle.speedX ** 2 + particle.speedY ** 2);
    const minSpeed = 0.5;
    if (currentSpeed < minSpeed) {
      const scale = minSpeed / currentSpeed;
      particle.speedX *= scale;
      particle.speedY *= scale;
    }
    
    // Apply velocity with deltaTime scaling and collision damping
    const damping = particle.hasCollided ? 0.8 : 1;
    particle.x += particle.speedX * (deltaTime / 16) * damping;
    particle.y += particle.speedY * (deltaTime / 16) * damping;
    
    return particle;
  }

  public handleBorderWrapping(particle: WindParticle): { x: number; y: number } {
    const buffer = 5;
    let newX = particle.x;
    let newY = particle.y;
    
    // Improved border wrapping with momentum preservation
    if (particle.x < -buffer) {
      newX = this.canvasWidth + (particle.x % this.canvasWidth);
      particle.speedX *= 0.9; // Slight speed reduction at borders
    } else if (particle.x > this.canvasWidth + buffer) {
      newX = particle.x % this.canvasWidth;
      particle.speedX *= 0.9;
    }
    
    if (particle.y < -buffer) {
      newY = this.canvasHeight + (particle.y % this.canvasHeight);
      particle.speedY *= 0.9;
    } else if (particle.y > this.canvasHeight + buffer) {
      newY = particle.y % this.canvasHeight;
      particle.speedY *= 0.9;
    }
    
    return { x: newX, y: newY };
  }
}
