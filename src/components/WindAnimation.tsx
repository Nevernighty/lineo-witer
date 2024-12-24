import React, { useEffect, useRef } from "react";

export interface WindAnimationProps {
  windSpeed: number;
  width?: number;
  height?: number;
}

export const WindAnimation: React.FC<WindAnimationProps> = ({ 
  windSpeed, 
  width = 300, 
  height = 300 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
    }> = [];

    const createParticles = () => {
      particles = [];
      const particleCount = Math.min(Math.floor(windSpeed * 10), 100);
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 1,
          speedX: (windSpeed / 10) * (Math.random() + 0.5),
          speedY: (Math.random() - 0.5) * windSpeed / 5
        });
      }
    };

    const animate = () => {
      ctx.fillStyle = "rgba(26, 31, 44, 0.2)";
      ctx.fillRect(0, 0, width, height);

      particles.forEach((particle, i) => {
        ctx.fillStyle = `rgba(57, 255, 20, ${0.5 + Math.random() * 0.5})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        particles[i].x += particle.speedX;
        particles[i].y += particle.speedY;

        if (particles[i].x > width) particles[i].x = 0;
        if (particles[i].y > height) particles[i].y = 0;
        if (particles[i].y < 0) particles[i].y = height;
      });

      requestAnimationFrame(animate);
    };

    createParticles();
    animate();
  }, [windSpeed, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="bg-stalker-dark/50 rounded-lg"
    />
  );
};

export default WindAnimation;