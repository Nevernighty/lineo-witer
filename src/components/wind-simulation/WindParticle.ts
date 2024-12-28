export interface WindParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  lifetime: number;
  trail?: { x: number; y: number }[];
  hasCollided?: boolean;
  collisionTimer: number;
  power?: number;
}

export const createWindParticle = (
  canvasWidth: number,
  canvasHeight: number,
  windSpeed: number,
  windAngle: number
): WindParticle => {
  const angleRad = (windAngle * Math.PI) / 180;
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    size: Math.random() * 2 + 1,
    speedX: Math.cos(angleRad) * windSpeed * (Math.random() + 0.5),
    speedY: Math.sin(angleRad) * windSpeed * (Math.random() + 0.5),
    color: 'rgba(57, 255, 20, 0.8)',
    lifetime: 300,
    trail: [],
    hasCollided: false,
    collisionTimer: 0,
    power: windSpeed * Math.random()
  };
};