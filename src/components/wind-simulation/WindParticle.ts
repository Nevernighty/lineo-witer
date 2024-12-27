export interface WindParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  trailTime?: number;
  hasCollided?: boolean;
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
    color: `rgba(57, 255, 20, ${0.5 + Math.random() * 0.5})`,
    trailTime: 0,
    hasCollided: false
  };
};