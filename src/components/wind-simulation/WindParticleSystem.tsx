import React, { useEffect, useRef } from "react";
import { WindParticle, Obstacle } from "./types";

interface WindParticleSystemProps {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  windSpeed: number;
  windAngle: number;
  windCurve: number;
  particleDensity: number;
  obstacles: Obstacle[];
}

export const WindParticleSystem: React.FC<WindParticleSystemProps> = ({
  ctx,
  canvasWidth,
  canvasHeight,
  windSpeed,
  windAngle,
  windCurve,
  particleDensity,
  obstacles,
}) => {
  const particlesRef = useRef<WindParticle[]>([]);

  useEffect(() => {
    const createParticles = () => {
      particlesRef.current = [];
      const angleRad = (windAngle * Math.PI) / 180;
      
      for (let i = 0; i < particleDensity; i++) {
        particlesRef.current.push({
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
          size: Math.random() * 2 + 1,
          speedX: Math.cos(angleRad) * windSpeed * (Math.random() + 0.5),
          speedY: Math.sin(angleRad) * windSpeed * (Math.random() + 0.5)
        });
      }
    };

    const checkCollision = (particle: WindParticle, obstacle: Obstacle) => {
      if (obstacle.type === "tree") {
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
      } else {
        return (
          particle.x >= obstacle.x - 5 &&
          particle.x <= obstacle.x + obstacle.width + 5 &&
          particle.y >= obstacle.y - 5 &&
          particle.y <= obstacle.y + obstacle.height + 5
        );
      }
    };

    const updateParticle = (particle: WindParticle) => {
      obstacles.forEach(obstacle => {
        if (checkCollision(particle, obstacle)) {
          particle.speedX *= -0.5;
          particle.speedY *= -0.5;
          particle.speedY += (Math.random() - 0.5) * windSpeed / 2;
          particle.speedX += (Math.random() - 0.5) * windSpeed / 2;
        }
      });

      particle.speedY += Math.sin(particle.x / canvasWidth * Math.PI * 2) * windCurve;
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      if (particle.x > canvasWidth) particle.x = 0;
      if (particle.x < 0) particle.x = canvasWidth;
      if (particle.y > canvasHeight) particle.y = 0;
      if (particle.y < 0) particle.y = canvasHeight;
    };

    const drawParticle = (particle: WindParticle) => {
      ctx.fillStyle = `rgba(57, 255, 20, ${0.5 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    };

    const animate = () => {
      particlesRef.current.forEach(particle => {
        updateParticle(particle);
        drawParticle(particle);
      });
      requestAnimationFrame(animate);
    };

    createParticles();
    animate();

    return () => {
      // Cleanup animation on unmount
      particlesRef.current = [];
    };
  }, [canvasWidth, canvasHeight, windSpeed, windAngle, windCurve, particleDensity, obstacles, ctx]);

  return null;
};